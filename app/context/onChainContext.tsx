// --- React Methods
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { ethers } from "ethers";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { UserContext } from "./userContext";

import { SchemaEncoder, EAS } from "@ethereum-attestation-service/eas-sdk";

import GitcoinResolver from "../contracts/GitcoinResolver.json";
import { JsonRpcProvider } from "@ethersproject/providers";

type OnChainProviderType = {
  providerHash: string;
  credentialHash: string;
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

        // debugger;

        // Set the on-chain status
        setOnChainProviders([]);
      } catch (e: any) {
        // debugger;
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
