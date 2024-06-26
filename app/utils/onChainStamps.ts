import { Contract, JsonRpcProvider, formatUnits, Signer, BrowserProvider, Eip1193Provider } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import axios from "axios";
import onchainInfo from "../../deployments/onchainInfo.json";
import GitcoinResolverAbi from "../../deployments/abi/GitcoinResolver.json";
import { Attestation, EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { chains } from "./chains";

import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { PROVIDER_ID, StampBit } from "@gitcoin/passport-types";
import { DecodedProviderInfo } from "../hooks/useOnChainData";

export type AttestationData = {
  passport: Attestation;
  score: Attestation;
};

type DecodedScoreAttestation = {
  score: number;
  issuanceDate?: Date;
  expirationDate?: Date;
};

const SCORE_MAX_AGE_MILLISECONDS = 1000 * 60 * 60 * 24 * 90; // 90 days

export async function getAttestationData(
  address: string,
  chainId: keyof typeof onchainInfo,
  provider: Eip1193Provider
): Promise<AttestationData | undefined> {
  try {
    const activeChainRpc = chains.find((chain) => chain.id === chainId)?.rpcUrl;
    if (!activeChainRpc) {
      throw new Error(`No rpcUrl found for chainId ${chainId}`);
    }

    const ethersProvider = new BrowserProvider(provider, "any");
    const signer = await ethersProvider.getSigner();

    const resolverAddress = onchainInfo[chainId].GitcoinResolver.address;
    const resolverAbi = GitcoinResolverAbi[chainId];
    const gitcoinResolverContract = new Contract(resolverAddress, resolverAbi, ethersProvider);

    const passportSchema = onchainInfo[chainId].easSchemas.passport.uid;
    const scoreSchema = onchainInfo[chainId].easSchemas.score.uid;

    const passportUid = await gitcoinResolverContract.userAttestations(address, passportSchema);
    const scoreUid = await gitcoinResolverContract.userAttestations(address, scoreSchema);

    const eas = new EAS(onchainInfo[chainId].EAS.address);

    eas.connect(signer);

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
  issuanceDates: bigint[];
  expirationDates: bigint[];
}> {
  if (attestation.data === "0x") {
    return {
      onChainProviderInfo: [],
      hashes: [],
      issuanceDates: [],
      expirationDates: [],
    };
  }

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

  const providers = decodedData.find((data) => data.name === "providers")?.value.value as bigint[];
  const issuanceDates = decodedData.find((data) => data.name === "issuanceDates")?.value.value as bigint[];
  const expirationDates = decodedData.find((data) => data.name === "expirationDates")?.value.value as bigint[];
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

export function decodeScoreAttestation(attestation: Attestation): DecodedScoreAttestation {
  if (attestation.data === "0x") {
    return {
      score: NaN,
    };
  }

  const schemaEncoder = new SchemaEncoder("uint256 score,uint32 scorer_id,uint8 score_decimals");
  const decodedData = schemaEncoder.decodeData(attestation.data);

  const score_as_integer = decodedData.find(({ name }) => name === "score")?.value.value as bigint;
  const score_decimals = decodedData.find(({ name }) => name === "score_decimals")?.value.value as bigint;

  const score = parseFloat(formatUnits(score_as_integer, score_decimals));
  const issuanceDate = new Date(BigNumber.from(attestation.time).mul(1000).toNumber()) || undefined;
  const expirationDate = issuanceDate ? new Date(issuanceDate.getTime() + SCORE_MAX_AGE_MILLISECONDS) : undefined;

  return {
    score,
    issuanceDate,
    expirationDate,
  };
}
