import onchainInfo from "../../deployments/onchainInfo.json";
import PassportResolverAbi from "../../deployments/abi/GitcoinResolver.json";
import PassportDecoderAbi from "../../deployments/abi/GitcoinPassportDecoder.json";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { formatUnits, PublicClient } from "viem";
import { PROVIDER_ID } from "@gitcoin/passport-types";

type CachedScore = {
  score: bigint;
  time: bigint;
  expirationTime: bigint;
};

type CachedStamp = {
  provider: string;
  hash: string;
  issuanceDate: bigint;
  expirationDate: bigint;
};

export type AttestationData = {
  providers: {
    providerName: PROVIDER_ID;
    credentialHash: string;
    issuanceDate: Date;
    expirationDate: Date;
  }[];
  score: {
    value: number;
    expirationDate: Date;
  };
};

const SCORE_MAX_AGE_MILLISECONDS = 1000 * 60 * 60 * 24 * 90; // 90 days

export async function getAttestationData({
  publicClient,
  address,
  chainId,
  customScorerId,
}: {
  publicClient: PublicClient;
  address: string;
  chainId: keyof typeof onchainInfo;
  customScorerId?: number;
}): Promise<AttestationData | undefined> {
  try {
    const resolverAddress = onchainInfo[chainId].GitcoinResolver.address;
    const resolverAbi = PassportResolverAbi[chainId];

    const decoderAddress = onchainInfo[chainId].GitcoinPassportDecoder.address;
    const decoderAbi = PassportDecoderAbi[chainId];

    const cachedScore = (await publicClient.readContract({
      abi: resolverAbi,
      address: resolverAddress as `0x${string}`,
      functionName: "getCachedScore",
      args: customScorerId ? [address, customScorerId] : [address],
    })) as CachedScore;

    console.log("cachedScore", cachedScore);

    const cachedPassport = (await publicClient.readContract({
      abi: decoderAbi,
      address: decoderAddress as `0x${string}`,
      functionName: "getPassport",
      args: [address],
    })) as CachedStamp[];

    console.log("cachedPassport", cachedPassport);

    const score = {
      value: parseFloat(formatUnits(cachedScore.score, 4)),
      expirationDate: new Date(parseInt(cachedScore.time.toString()) * 1000 + SCORE_MAX_AGE_MILLISECONDS),
    };

    console.log("score", score);

    const providers = cachedPassport.map(({ provider, hash, issuanceDate, expirationDate }) => ({
      providerName: provider as PROVIDER_ID,
      credentialHash: `v0.0.0:${Buffer.from(hash.slice(2), "hex").toString("base64")}`,
      issuanceDate: new Date(Number(issuanceDate) * 1000),
      expirationDate: new Date(Number(expirationDate) * 1000),
    }));

    console.log("providers", providers);

    return {
      providers,
      score,
    };
  } catch (e: any) {
    console.error("Failed to get attestation data", e);
    datadogLogs.logger.error("Failed to check onchain status", e);
    datadogRum.addError(e);
  }
}
