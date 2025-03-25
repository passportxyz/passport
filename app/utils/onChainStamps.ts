import onchainInfo from "../../deployments/onchainInfo.json";
import PassportResolverAbi from "../../deployments/abi/GitcoinResolver.json";
import PassportDecoderAbi from "../../deployments/abi/GitcoinPassportDecoder.json";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { Abi, formatUnits, PublicClient } from "viem";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { cleanAndParseAbi } from "./helpers";
import { ZERO_BYTES32 } from "@ethereum-attestation-service/eas-sdk";

type CachedScore = {
  score: number;
  time: bigint;
  expirationTime: bigint;
};

type CachedStamp = {
  provider: string;
  issuanceDate: bigint;
  expirationDate: bigint;
};

export type AttestationData = {
  providers: {
    providerName: PROVIDER_ID;
    issuanceDate: Date;
    expirationDate: Date;
  }[];
  score: {
    value: number;
    expirationDate: Date;
  };
};

const SCORE_MAX_AGE_MILLISECONDS = 1000 * 60 * 60 * 24 * 90; // 90 days

const getPassport = async ({
  publicClient,
  address,
  decoderAddress,
  decoderAbi,
}: {
  publicClient: PublicClient;
  address: `0x${string}`;
  decoderAddress: string;
  decoderAbi: Abi;
}): Promise<CachedStamp[]> => {
  try {
    return (await publicClient.readContract({
      abi: decoderAbi,
      address: decoderAddress as `0x${string}`,
      functionName: "getPassport",
      args: [address],
    })) as CachedStamp[];
  } catch {
    return [];
  }
};

export async function getAttestationData({
  publicClient,
  address,
  chainId,
  customScorerId,
}: {
  publicClient: PublicClient;
  address: `0x${string}`;
  chainId: keyof typeof onchainInfo;
  customScorerId?: number;
}): Promise<AttestationData | undefined> {
  try {
    const resolverAddress = onchainInfo[chainId].GitcoinResolver.address;
    const resolverAbi = cleanAndParseAbi(PassportResolverAbi[chainId]);

    const decoderAddress = onchainInfo[chainId].GitcoinPassportDecoder.address;
    const decoderAbi = cleanAndParseAbi(PassportDecoderAbi[chainId]);

    const cachedScore = (await publicClient.readContract({
      abi: resolverAbi,
      address: resolverAddress as `0x${string}`,
      functionName: "getCachedScore",
      args: customScorerId ? [customScorerId, address] : [address],
    })) as CachedScore;

    const score = {
      value: parseFloat(formatUnits(BigInt(cachedScore.score), 4)),
      expirationDate: new Date(
        cachedScore.expirationTime > 0
          ? parseInt(cachedScore.expirationTime.toString()) * 1000
          : parseInt(cachedScore.time.toString()) * 1000 + SCORE_MAX_AGE_MILLISECONDS
      ),
    };

    const cachedPassport = await getPassport({
      publicClient,
      address,
      decoderAddress,
      decoderAbi,
    });

    const providers = cachedPassport.map(({ provider, issuanceDate, expirationDate }) => ({
      providerName: provider as PROVIDER_ID,
      issuanceDate: new Date(Number(issuanceDate) * 1000),
      expirationDate: new Date(Number(expirationDate) * 1000),
    }));

    return {
      providers,
      score,
    };
  } catch (e: any) {
    console.error("Failed to get attestation data for", chainId, address, e);
    datadogLogs.logger.error("Failed to check onchain status", e);
    datadogRum.addError(e);
  }
}
