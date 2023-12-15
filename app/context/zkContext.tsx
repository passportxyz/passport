// --- React Methods
import React, { useMemo } from "react";

// --- Wallet connection utilities
import { Web3Provider } from "@ethersproject/providers";

import { isServerOnMaintenance } from "../utils/helpers";
import { onboard } from "../utils/onboard";

// --- Utils & configs
import { create } from "zustand";

export type ZkStampInput = {
  providerName: string;
  provider: string;
  hash: string;
};

const zkStore = create<{
  addStamps: (stampInputs: ZkStampInput[]) => void;
  clearStamps: () => void;
  loadStamps: () => void;
  generateProof: () => Promise<void>;
  stampInputs: ZkStampInput[];
  stampsByProviderHash: Record<string, ZkStampInput>;
}>((set) => ({
  stampInputs: [],
  stampsByProviderHash: {},
  clearStamps: (): void => {
    localStorage.removeItem("zk-stamps");
    set({
      stampInputs: [],
      stampsByProviderHash: {},
    });
  },

  loadStamps: (): void => {
    try {
      const zkStampsJsonString = localStorage.getItem("zk-stamps");
      const stampsByProviderHash = JSON.parse(zkStampsJsonString || "[]") as Record<string, ZkStampInput>;

      const stampInputs = Object.values(stampsByProviderHash);
      set({
        stampInputs: stampInputs,
        stampsByProviderHash: stampsByProviderHash,
      });
    } catch (error) {
      console.error(error);
      localStorage.removeItem("zk-stamps");
    }
  },

  addStamps: (newStampInputs: ZkStampInput[]): void => {
    try {
      const zkStampsJsonString = localStorage.getItem("zk-stamps");
      const zkStamps = JSON.parse(zkStampsJsonString || "{}") as Record<string, ZkStampInput>;

      const stampsByProviderHash: Record<string, ZkStampInput> = newStampInputs.reduce((acc, zkStamp) => {
        acc[zkStamp.provider] = zkStamp;
        return acc;
      }, zkStamps as Record<string, ZkStampInput>);

      const stampInputs = Object.values(stampsByProviderHash);
      localStorage.setItem("zk-stamps", JSON.stringify(stampsByProviderHash));
      set({
        stampInputs: stampInputs,
        stampsByProviderHash: stampsByProviderHash,
      });
    } catch (error) {
      console.error(error);
      localStorage.removeItem("zk-stamps");
    }
  },
  generateProof: async () => {},
}));

// Export as hook
export const useZkStore = zkStore;
