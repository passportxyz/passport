// --- React Methods
import React, { useMemo } from "react";

// --- Wallet connection utilities
import { Web3Provider } from "@ethersproject/providers";

import { isServerOnMaintenance } from "../utils/helpers";
import { onboard } from "../utils/onboard";

// --- Utils & configs
import { create } from "zustand";
import { WalletState } from "@web3-onboard/core/dist/types";
import { Eip1193Provider } from "ethers";

const getPreviouslyUsedWalletLabel = () => window.localStorage.getItem("previouslyUsedWalletLabel") || "";

type ConnectCallback = (address: string, provider: Eip1193Provider) => Promise<void>;

type ZkStampInput = {
  provider: string;
  hash: string;
};

const zkStore = create<{
  addStamps: (stampInputs: ZkStampInput[]) => void;
  generateProof: () => Promise<void>;
  stampInputs: ZkStampInput[];
}>((set) => ({
  stampInputs: [],

  addStamps: (stampInputs: ZkStampInput[]): void => {},
  generateProof: async () => {},
}));

// Export as hook
export const useZkStore = zkStore;
