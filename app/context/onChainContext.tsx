// --- React Methods
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { ethers } from "ethers";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { UserContext } from "./userContext";

import { SchemaEncoder, EAS } from "@ethereum-attestation-service/eas-sdk";

import GitcoinResolver from "../contracts/GitcoinResolver.json";
import { JsonRpcProvider } from "@ethersproject/providers";

import { PROVIDER_ID, StampBit } from "@gitcoin/passport-types";

import { BigNumber } from "@ethersproject/bignumber";

import axios from "axios";

type OnChainProviderType = {
  providerName: PROVIDER_ID;
  credentialHash: string;
  expirationDate: Date;
  issuanceDate: Date;
};

export interface OnChainContextState {
  onChainProviders: OnChainProviderType[];
  refreshOnChainProviders: () => Promise<void>;
}

const startingState: OnChainContextState = {
  onChainProviders: [],
  refreshOnChainProviders: async (): Promise<void> => {},
};

// create our app context
export const OnChainContext = createContext(startingState);

function hexToBinary(hex: string): string {
  let binary = "";
  hex = hex.replace("0x", ""); // Remove '0x' if it exists
  for (let i = 0; i < hex.length; i++) {
    const hexDigit = parseInt(hex[i], 16); // Convert the hex digit to a base 10 integer
    const binaryDigit = hexDigit.toString(2); // Convert the base 10 integer to binary
    binary += binaryDigit.padStart(4, "0"); // Pad with zeros to ensure it's a 4-digit binary number
  }
  return binary;
}

export const OnChainContextProvider = ({ children }: { children: any }) => {
  const { address, wallet } = useContext(UserContext);
  const [onChainProviders, setOnChainProviders] = useState<OnChainProviderType[]>([]);

  const fetchOnChainStatus = useCallback(async () => {
    if (wallet && address) {
      try {
        if (!process.env.NEXT_PUBLIC_GITCOIN_RESOLVER_CONTRACT_ADDRESS) {
          throw new Error("NEXT_PUBLIC_GITCOIN_RESOLVER_CONTRACT_ADDRESS is not defined");
        }

        if (!process.env.NEXT_PUBLIC_EAS_ADDRESS) {
          throw new Error("NEXT_PUBLIC_EAS_ADDRESS is not defined");
        }

        const ethersProvider = new ethers.BrowserProvider(wallet.provider, "any");
        const signer = await ethersProvider.getSigner();

        const gitcoinAttesterContract = new ethers.Contract(
          process.env.NEXT_PUBLIC_GITCOIN_RESOLVER_CONTRACT_ADDRESS as string,
          GitcoinResolver.abi,
          signer
        );

        const passportUid = await gitcoinAttesterContract.passports(address);

        const eas = new EAS(process.env.NEXT_PUBLIC_EAS_ADDRESS);

        // needed for ethers v5 eas dependency
        const ethersV5Provider = new JsonRpcProvider(process.env.NEXT_PUBLIC_PASSPORT_BASE_GOERLI_RPC_URL);
        eas.connect(ethersV5Provider);

        const passportAttestationData = await eas.getAttestation(passportUid);

        const schemaEncoder = new SchemaEncoder(
          "uint256[] providers,bytes32[] hashes,uint64[] issuanceDates,uint64[] expirationDates,uint16 providerMapVersion"
        );
        const decodedData = schemaEncoder.decodeData(passportAttestationData.data);

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

        const onChainProviders: OnChainProviderType[] = onChainProviderInfo
          .sort((a, b) => a.providerNumber - b.providerNumber)
          .map((providerInfo, index) => ({
            providerName: providerInfo.providerName,
            credentialHash: `v0.0.0:${Buffer.from(hashes[index].slice(2), "hex").toString("base64")}`,
            expirationDate: new Date(expirationDates[index].toNumber() * 1000),
            issuanceDate: new Date(issuanceDates[index].toNumber() * 1000),
          }));

        // Set the on-chain status
        setOnChainProviders(onChainProviders);
      } catch (e: any) {
        datadogLogs.logger.error("Failed to check on-chain status", e);
        datadogRum.addError(e);
      }
    }
  }, [wallet, address]);

  const refreshOnChainProviders = () => {
    return fetchOnChainStatus();
  };

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_FF_CHAIN_SYNC === "on") {
      fetchOnChainStatus();
    }
  }, [fetchOnChainStatus]);

  // use props as a way to pass configuration values
  const providerProps = {
    onChainProviders,
    refreshOnChainProviders,
  };

  return <OnChainContext.Provider value={providerProps}>{children}</OnChainContext.Provider>;
};
