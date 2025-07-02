import React from "react";

// Mock wagmi hooks for dev mode
// Valid checksummed Ethereum address (this is a real valid address format)
const mockAddress = "0x0000000000000000000000000000000000000001";

// Handle crypto.subtle not being available in non-secure contexts
if (typeof window !== "undefined" && window.crypto && !window.crypto.subtle) {
  console.warn("🔧 Dev Mode: crypto.subtle not available, using mock");
  // Add subtle to existing crypto object
  Object.defineProperty(window.crypto, "subtle", {
    value: {
      digest: async (algorithm: string, data: ArrayBuffer) => {
        console.log("🔧 Dev Mode: Mock crypto.subtle.digest called", algorithm);
        // Return a mock hash
        return new ArrayBuffer(32);
      },
    },
    writable: true,
    configurable: true,
  });
}

export const useAccount = () => {
  console.log("🔧 Dev Mode: useAccount called, returning mock address:", mockAddress);
  return {
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
    status: "connected" as const,
  };
};

export const useWalletClient = () => ({
  data: {
    account: {
      address: mockAddress,
      type: "json-rpc" as const,
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

export const useChainId = () => 1;

export const useDisconnect = () => ({
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

export const useBalance = () => ({
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

export const useSwitchChain = () => ({
  switchChain: () => {
    console.log("🔧 Dev Mode: Mock switch chain called");
  },
  chains: [{ id: 1, name: "Ethereum" }],
  isLoading: false,
  isSuccess: false,
  isError: false,
});

// Mock WagmiProvider component
export const WagmiProvider = ({ children, config }: { children: React.ReactNode; config: any }) => {
  console.log("🔧 Dev Mode: Using mock WagmiProvider");
  return <>{children}</>;
};

// Mock other commonly used wagmi exports
export const useConnect = () => ({
  connect: () => console.log("🔧 Dev Mode: Mock connect called"),
  connectors: [],
  error: null,
  isLoading: false,
  pendingConnector: null,
});

export const useNetwork = () => ({
  chain: { id: 1, name: "Ethereum" },
  chains: [{ id: 1, name: "Ethereum" }],
});

export const useSignMessage = () => ({
  signMessage: async ({ message }: { message: string }) => {
    console.log("🔧 Dev Mode: Mock sign message:", message);
    return { signature: "0x" + "c".repeat(130) };
  },
  signMessageAsync: async ({ message }: { message: string }) => {
    console.log("🔧 Dev Mode: Mock sign message async:", message);
    return "0x" + "c".repeat(130);
  },
  isLoading: false,
  isSuccess: false,
  isError: false,
});

export const usePublicClient = () => ({
  // Mock public client
  request: async (args: any) => {
    console.log("🔧 Dev Mode: Mock public client request:", args);
    return null;
  },
  chain: { id: 1, name: "Ethereum" },
});

export const useReadContract = () => ({
  data: undefined,
  isError: false,
  isLoading: false,
  isSuccess: true,
});

export const useWriteContract = () => ({
  writeContract: async (args: any) => {
    console.log("🔧 Dev Mode: Mock write contract:", args);
    return { hash: "0x" + "d".repeat(64) };
  },
  writeContractAsync: async (args: any) => {
    console.log("🔧 Dev Mode: Mock write contract async:", args);
    return { hash: "0x" + "d".repeat(64) };
  },
  data: undefined,
  isLoading: false,
  isSuccess: false,
  isError: false,
});

export const useSendTransaction = () => ({
  sendTransaction: async (args: any) => {
    console.log("🔧 Dev Mode: Mock send transaction:", args);
    return { hash: "0x" + "e".repeat(64) };
  },
  sendTransactionAsync: async (args: any) => {
    console.log("🔧 Dev Mode: Mock send transaction async:", args);
    return { hash: "0x" + "e".repeat(64) };
  },
  data: undefined,
  isLoading: false,
  isSuccess: false,
  isError: false,
});

// Mock chain definitions with proper structure
const mockChains = [
  { id: 1, name: "Ethereum", network: "homestead", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 } },
  { id: 10, name: "Optimism", network: "optimism", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 } },
  {
    id: 11155111,
    name: "Sepolia",
    network: "sepolia",
    nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  },
  { id: 31337, name: "Hardhat", network: "hardhat", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 } },
  {
    id: 11155420,
    name: "OP Sepolia Testnet",
    network: "optimism-sepolia",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  {
    id: 534351,
    name: "Scroll Sepolia",
    network: "scroll-sepolia",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  { id: 137, name: "Polygon", network: "polygon", nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 } },
  { id: 250, name: "Fantom", network: "fantom", nativeCurrency: { name: "Fantom", symbol: "FTM", decimals: 18 } },
  { id: 8453, name: "Base", network: "base", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 } },
  { id: 59144, name: "Linea", network: "linea", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 } },
  {
    id: 42161,
    name: "Arbitrum One",
    network: "arbitrum",
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  },
  { id: 324, name: "zkSync", network: "zksync", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 } },
  { id: 534352, name: "Scroll", network: "scroll", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 } },
  {
    id: 43114,
    name: "Avalanche",
    network: "avalanche",
    nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  },
  { id: 360, name: "Shape", network: "shape", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 } },
];

export const useChains = () => mockChains;

// Export wagmiChains for compatibility
export const wagmiChains = mockChains;

// Export individual chain objects to match @reown/appkit/networks imports
export const mainnet = mockChains[0];
export const optimism = mockChains[1];
export const sepolia = mockChains[2];
export const hardhat = mockChains[3];
export const optimismSepolia = mockChains[4];
export const scrollSepolia = mockChains[5];
export const polygon = mockChains[6];
export const fantom = mockChains[7];
export const base = mockChains[8];
export const linea = mockChains[9];
export const arbitrum = mockChains[10];
export const zksync = mockChains[11];
export const scroll = mockChains[12];
export const avalanche = mockChains[13];
export const shape = mockChains[14];

export const useEnsName = () => ({
  data: undefined,
  isError: false,
  isLoading: false,
  isSuccess: false,
});

// Mock Config type
export type Config = any;

// Additional mock for createConfig that might be used
export const createConfig = (config: any) => {
  console.log("🔧 Dev Mode: Mock createConfig called");
  return config;
};

// Mock viem's http transport
export const http = (url?: string) => {
  console.log("🔧 Dev Mode: Mock http transport created for:", url);
  return {
    type: "http",
    url,
  };
};
