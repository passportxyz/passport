import { Contract, JsonRpcProvider, formatUnits } from "ethers";
import { JsonRpcProvider as V5JsonRpcProvider } from "@ethersproject/providers";
import { BigNumber } from "@ethersproject/bignumber";
import onchainInfo from "../../deployments/onchainInfo.json";
import GitcoinResolverAbi from "../../deployments/abi/GitcoinResolver.json";
import { Attestation, EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { Chain, chains } from "./chains";

import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { OnChainProviderType } from "../context/onChainContext";
import { ethers } from "ethers";

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

export function decodeScoreAttestation(attestation: Attestation): number {
  if (attestation.data === "0x") {
    return NaN;
  }

  const schemaEncoder = new SchemaEncoder("uint256 score,uint32 scorer_id,uint8 score_decimals");
  const decodedData = schemaEncoder.decodeData(attestation.data);

  const score_as_integer = (decodedData.find(({ name }) => name === "score")?.value.value as BigNumber)._hex;
  const score_decimals = decodedData.find(({ name }) => name === "score_decimals")?.value.value as number;

  const score = parseFloat(formatUnits(score_as_integer, score_decimals));

  return score;
}

export const parsePassportData = (passportResponse: any): OnChainProviderType[] => {
  return passportResponse.map((passport: any) => ({
    providerName: passport[0],
    credentialHash: `v0.0.0:${Buffer.from(passport[1].replace(/^0x/, ""), "hex").toString("base64")}`,
    expirationDate: Number(passport[3]) * 1000,
    issuanceDate: Number(passport[2]) * 1000,
  }));
};

export const loadDecoderContract = (chain: Chain): Contract => {
  if (chain.attestationProvider?.status !== "enabled") {
    throw new Error(`Active attestationProvider not found for chainId ${chain.id}`);
  }

  const provider = new ethers.JsonRpcProvider(chain.rpcUrl);

  const decoderAddress = chain.attestationProvider.decoderAddress();
  const decoderAbi = chain.attestationProvider.decoderAbi();

  return new ethers.Contract(decoderAddress, decoderAbi, provider);
};
