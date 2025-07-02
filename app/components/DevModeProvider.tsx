import React, { useEffect, useState, useContext } from "react";
import { startMockServiceWorker } from "../mocks/browser";
import { DatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { DID } from "dids";

interface DevModeProviderProps {
  children: React.ReactNode;
}

// Wrap children with mock datastore context in dev mode
const DevModeDatastoreWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockAddress = "0xDEV123456789ABCDEF123456789ABCDEF123456";

  // Create a mock DID
  const mockDid = {
    parent: `did:pkh:eip155:1:${mockAddress.toLowerCase()}`,
    id: `did:pkh:eip155:1:${mockAddress.toLowerCase()}`,
  } as unknown as DID;

  const mockDatastoreState = {
    dbAccessTokenStatus: "connected" as const,
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

  return (
    <DatastoreConnectionContext.Provider value={mockDatastoreState}>{children}</DatastoreConnectionContext.Provider>
  );
};

export const DevModeProvider: React.FC<DevModeProviderProps> = ({ children }) => {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
      // Set up mock service worker
      startMockServiceWorker().then(() => {
        console.log("🔧 Dev Mode: MSW Started");
        setMswReady(true);
      });

      // Monkey patch wagmi hooks in dev mode
      const mockAddress = "0xDEV123456789ABCDEF123456789ABCDEF123456";

      // Override wagmi module hooks
      const wagmi = require("wagmi");

      // Mock useAccount
      wagmi.useAccount = () => ({
        address: mockAddress,
        addresses: [mockAddress],
        isConnected: true,
        isConnecting: false,
        isDisconnected: false,
        isReconnecting: false,
        connector: { id: "mockConnector", name: "Dev Mode Wallet", type: "mockConnector" },
        chain: {
          id: 1,
          name: "Ethereum",
          network: "homestead",
          nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        },
        chainId: 1,
        status: "connected",
      });

      // Mock useWalletClient
      wagmi.useWalletClient = () => ({
        data: {
          account: {
            address: mockAddress,
            type: "json-rpc",
          },
          chain: { id: 1, name: "Ethereum" },
          signMessage: async ({ message }: { message: string }) => {
            console.log("🔧 Dev Mode: Mock signing message:", message);
            return "0x" + "a".repeat(130); // Mock signature
          },
          signTypedData: async (data: any) => {
            console.log("🔧 Dev Mode: Mock signing typed data:", data);
            return "0x" + "b".repeat(130); // Mock signature
          },
          transport: {},
        },
        isLoading: false,
        isSuccess: true,
        isError: false,
      });

      // Mock useChainId
      wagmi.useChainId = () => 1;

      // Mock useDisconnect
      wagmi.useDisconnect = () => ({
        disconnect: () => {
          console.log("🔧 Dev Mode: Mock disconnect called");
        },
        disconnectAsync: async () => {
          console.log("🔧 Dev Mode: Mock disconnect called");
        },
        isLoading: false,
        isSuccess: false,
        isError: false,
      });

      // Mock useBalance
      wagmi.useBalance = () => ({
        data: {
          decimals: 18,
          formatted: "100.0",
          symbol: "ETH",
          value: BigInt("100000000000000000000"),
        },
        isLoading: false,
        isSuccess: true,
        isError: false,
      });

      // Mock useSwitchChain
      wagmi.useSwitchChain = () => ({
        switchChain: () => {
          console.log("🔧 Dev Mode: Mock switch chain called");
        },
        chains: [{ id: 1, name: "Ethereum" }],
        isLoading: false,
        isSuccess: false,
        isError: false,
      });

      console.log("🔧 Dev Mode: Wagmi hooks mocked");
    } else {
      setMswReady(true);
    }
  }, []);

  // If not in dev mode, just pass through
  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
    return <>{children}</>;
  }

  // Wait for MSW to be ready
  if (!mswReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-color-1">Setting up dev mode...</div>
      </div>
    );
  }

  // In dev mode, wrap with mock datastore context
  return <DevModeDatastoreWrapper>{children}</DevModeDatastoreWrapper>;
};
