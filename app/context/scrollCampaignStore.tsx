import { VerifiableCredential } from "@gitcoin/passport-types";
import { create } from "zustand";

/**
 * Store & manage the credentials relevant for the scroll campaign
 */
const scrollStampsStore = create<{
  credentials: VerifiableCredential[];
  setCredentials: (credentials: VerifiableCredential[]) => {};
}>((set) => ({
  credentials: [] as VerifiableCredential[],
  setCredentials: async (credentials: VerifiableCredential[]) => {
    set({ credentials });
  },
}));

// Use as hook
export const useScrollStampsStore = scrollStampsStore;
