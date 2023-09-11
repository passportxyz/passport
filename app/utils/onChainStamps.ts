import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import { JsonRpcProvider as V5JsonRpcProvider } from "@ethersproject/providers";
import { BigNumber } from "@ethersproject/bignumber";
import axios from "axios";
import onchainInfo from "../../deployments/onchainInfo.json";
import GitcoinResolverAbi from "../../deployments/abi/GitcoinResolver.json";
import { Attestation, EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { chains } from "./chains";

import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { PROVIDER_ID, StampBit } from "@gitcoin/passport-types";
import { DecodedProviderInfo } from "../context/onChainContext";

export type AttestationData = {
  passport: Attestation;
  score: Attestation;
};

export async function getAttestationData(
  address: string,
  chainId: keyof typeof onchainInfo
): Promise<AttestationData | undefined> {
  try {
    const activeChainRpc = chains.find((chain) => chain.id === chainId)?.rpcUrl;

    if (!activeChainRpc) {
      throw new Error(`No rpcUrl found for chainId ${chainId}`);
    }

    const ethersProvider = new JsonRpcProvider(activeChainRpc);

    const resolverAddress = onchainInfo[chainId].GitcoinResolver.address;
    const resolverAbi = GitcoinResolverAbi[chainId];
    const gitcoinResolverContract = new Contract(resolverAddress, resolverAbi, ethersProvider);

    const passportSchema = onchainInfo[chainId].easSchemas.passport.uid;
    const scoreSchema = onchainInfo[chainId].easSchemas.score.uid;

    const passportUid = await gitcoinResolverContract.userAttestations(address, passportSchema);
    const scoreUid = await gitcoinResolverContract.userAttestations(address, scoreSchema);

    const eas = new EAS(onchainInfo[chainId].EAS.address);

    // needed for ethers v5 eas dependency
    const ethersV5Provider = new V5JsonRpcProvider(activeChainRpc);
    eas.connect(ethersV5Provider);

    return {
      passport: await eas.getAttestation(passportUid),
      score: await eas.getAttestation(scoreUid),
    };
  } catch (e: any) {
    datadogLogs.logger.error("Failed to check onchain status", e);
    datadogRum.addError(e);
  }
}

export async function decodeProviderInformation(attestation: Attestation): Promise<{
  onChainProviderInfo: DecodedProviderInfo[];
  hashes: string[];
  issuanceDates: BigNumber[];
  expirationDates: BigNumber[];
}> {
  const schemaEncoder = new SchemaEncoder(
    "uint256[] providers,bytes32[] hashes,uint64[] issuanceDates,uint64[] expirationDates,uint16 providerMapVersion"
  );
  const decodedData = schemaEncoder.decodeData(attestation.data);
  const providerBitMapInfo = (await axios.get(
    `${process.env.NEXT_PUBLIC_PASSPORT_IAM_STATIC_URL}/providerBitMapInfo.json`
  )) as {
    data: StampBit[];
  };

  type DecodedProviderInfo = {
    providerName: PROVIDER_ID;
    providerNumber: number;
  };

  const providers = decodedData.find((data) => data.name === "providers")?.value.value as BigNumber[];
  const issuanceDates = decodedData.find((data) => data.name === "issuanceDates")?.value.value as BigNumber[];
  const expirationDates = decodedData.find((data) => data.name === "expirationDates")?.value.value as BigNumber[];
  const hashes = decodedData.find((data) => data.name === "hashes")?.value.value as string[];

  const onChainProviderInfo: DecodedProviderInfo[] = providerBitMapInfo.data
    .map((info) => {
      const providerMask = BigNumber.from(1).shl(info.bit);
      const currentProvidersBitmap = providers[info.index];
      if (currentProvidersBitmap && !providerMask.and(currentProvidersBitmap).eq(BigNumber.from(0))) {
        return {
          providerName: info.name,
          providerNumber: info.index * 256 + info.bit,
        };
      }
    })
    .filter((provider): provider is DecodedProviderInfo => provider !== undefined);

  return { onChainProviderInfo, hashes, issuanceDates, expirationDates };
}

export async function decodeScoreAttestation(attestation: Attestation): Promise<number> {
  const schemaEncoder = new SchemaEncoder("uint256 score,uint32 scorer_id,uint8 score_decimals");
  const decodedData = schemaEncoder.decodeData(attestation.data);

  const score_as_integer = (decodedData.find(({ name }) => name === "score")?.value.value as BigNumber)._hex;
  const score_decimals = decodedData.find(({ name }) => name === "score_decimals")?.value.value as number;

  const score = parseFloat(formatUnits(score_as_integer, score_decimals));

  return score;
}
