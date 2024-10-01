import { Contract, JsonRpcProvider, formatUnits, BigNumberish } from "ethers";
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
import { DecodedProviderInfo } from "../hooks/useOnChainData";

export type AttestationData = {
  passport: Attestation;
  score: {
    value: number;
    expirationDate: Date;
  };
};

const SCORE_MAX_AGE_MILLISECONDS = 1000 * 60 * 60 * 24 * 90; // 90 days

export async function getAttestationData(
  address: string,
  chainId: keyof typeof onchainInfo,
  customScorerId?: number
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

    const passportUid = await gitcoinResolverContract.userAttestations(address, passportSchema);
    let cachedScore: {
      score: BigNumberish;
      time: BigNumberish;
      expirationTime: BigNumberish;
    };
    if (customScorerId) {
      cachedScore = await gitcoinResolverContract["getCachedScore(uint32,address)"](customScorerId, address);
    } else {
      cachedScore = await gitcoinResolverContract.getCachedScore(address);
    }

    const eas = new EAS(onchainInfo[chainId].EAS.address);

    // needed for ethers v5 eas dependency
    const ethersV5Provider = new V5JsonRpcProvider(activeChainRpc);
    eas.connect(ethersV5Provider);

    const score = {
      value: parseFloat(formatUnits(cachedScore.score, 4)),
      expirationDate: new Date(parseInt(cachedScore.time.toString()) * 1000 + SCORE_MAX_AGE_MILLISECONDS),
    };

    return {
      passport: await eas.getAttestation(passportUid),
      score,
    };
  } catch (e: any) {
    console.error("Failed to get attestation data", e);
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
