import { WalletState } from "@web3-onboard/core";
import { BrowserProvider, Contract, formatUnits, BigNumberish } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import axios from "axios";
import GitcoinResolver from "../contracts/GitcoinResolver.json";
import { JsonRpcProvider } from "@ethersproject/providers";
import { Attestation, EAS, SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";

import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { PROVIDER_ID, StampBit } from "@gitcoin/passport-types";
import { DecodedProviderInfo } from "../context/onChainContext";

type AttestationData = {
  passport: Attestation;
  score: Attestation;
};

export async function getAttestationData(wallet: WalletState, address: string): Promise<AttestationData | undefined> {
  try {
    if (!process.env.NEXT_PUBLIC_GITCOIN_RESOLVER_CONTRACT_ADDRESS) {
      throw new Error("NEXT_PUBLIC_GITCOIN_RESOLVER_CONTRACT_ADDRESS is not defined");
    }

    if (!process.env.NEXT_PUBLIC_EAS_ADDRESS) {
      throw new Error("NEXT_PUBLIC_EAS_ADDRESS is not defined");
    }

    const ethersProvider = new BrowserProvider(wallet.provider, "any");
    const signer = await ethersProvider.getSigner();

    const gitcoinResolverContract = new Contract(
      process.env.NEXT_PUBLIC_GITCOIN_RESOLVER_CONTRACT_ADDRESS as string,
      GitcoinResolver.abi,
      signer
    );

    const passportUid = await gitcoinResolverContract.passports(address);
    const scoreUid = await gitcoinResolverContract.scores(address);

    const eas = new EAS(process.env.NEXT_PUBLIC_EAS_ADDRESS);

    // needed for ethers v5 eas dependency
    const ethersV5Provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_PASSPORT_BASE_GOERLI_RPC_URL);
    eas.connect(ethersV5Provider);

    return {
      passport: await eas.getAttestation(passportUid),
      score: await eas.getAttestation(scoreUid),
    };
  } catch (e: any) {
    datadogLogs.logger.error("Failed to check on-chain status", e);
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

  const score_as_integer = (decodedData.find(({ name }) => name === "score")?.value.value as BigNumber)._hex as string;
  const score_decimals = decodedData.find(({ name }) => name === "score_decimals")?.value.value as number;

  const score = parseFloat(formatUnits(score_as_integer, score_decimals));

  return score;
}
