import React, { createContext, useContext } from "react";
import { DID } from "dids";

export type DbAuthTokenStatus = "idle" | "failed" | "connected" | "connecting";

export type DatastoreConnectionContextState = {
  dbAccessTokenStatus: DbAuthTokenStatus;
  dbAccessToken?: string;
  did?: DID;
  disconnect: (address: string) => Promise<void>;
  connect: (address: string, walletClient: any) => Promise<void>;
  checkSessionIsValid: () => boolean;
};

// Create a mock DID
const mockAddress = "0x0000000000000000000000000000000000000001";
const mockDid = {
  parent: `did:pkh:eip155:1:${mockAddress}`,
  id: `did:pkh:eip155:1:${mockAddress}`,
} as unknown as DID;

const mockDatastoreState: DatastoreConnectionContextState = {
  dbAccessTokenStatus: "connected",
  dbAccessToken: "mock-dev-token-12345",
  did: mockDid,
  disconnect: async (address: string) => {
    console.log("🔧 Dev Mode: Mock disconnect called for", address);
  },
  connect: async (address: string) => {
    console.log("🔧 Dev Mode: Mock connect called for", address);
  },
  checkSessionIsValid: () => true,
};

export const DatastoreConnectionContext = createContext<DatastoreConnectionContextState>(mockDatastoreState);

export const DatastoreConnectionContextProvider = ({ children }: { children: React.ReactNode }) => {
  console.log("🔧 Dev Mode: Using mock DatastoreConnectionContextProvider");
  return (
    <DatastoreConnectionContext.Provider value={mockDatastoreState}>{children}</DatastoreConnectionContext.Provider>
  );
};

export const useDatastoreConnectionContext = () => {
  console.log("🔧 Dev Mode: useDatastoreConnectionContext called, returning mock connected state");
  return mockDatastoreState;
};

// Export the hook that might be used directly
export const useDatastoreConnection = () => {
  console.log("🔧 Dev Mode: useDatastoreConnection called");
  return mockDatastoreState;
};
