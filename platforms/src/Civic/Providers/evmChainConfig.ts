type EvmChain = {
  chainId: number;
  rpcUrl: string;
  name: string;
  mainnet: boolean;
};

export type SupportedChain =
  // Mainnets
  | "ETHEREUM_MAINNET"
  | "POLYGON_POS_MAINNET"
  | "POLYGON_ZKEVM_MAINNET"
  | "ARBITRUM_MAINNET"
  | "XDC_MAINNET"
  // Testnets
  | "GOERLI"
  | "SEPOLIA"
  | "MUMBAI"
  | "POLYGON_ZKEVM_TESTNET"
  | "ARBITRUM_GOERLI"
  | "XDC_APOTHEM";

export const EVM_CHAIN_CONFIG: Record<SupportedChain, EvmChain> = {
  // Mainnets
  ETHEREUM_MAINNET: {
    chainId: 1,
    rpcUrl: process.env.NEXT_PUBLIC_PASSPORT_MAINNET_RPC_URL || "https://mainnet.infura.io/v3",
    name: "Ethereum",
    mainnet: true,
  },
  POLYGON_POS_MAINNET: {
    chainId: 137,
    rpcUrl: process.env.POLYGON_RPC_URL || "https://polygon-rpc.com",
    name: "Polygon PoS",
    mainnet: true,
  },
  POLYGON_ZKEVM_MAINNET: {
    chainId: 1101,
    rpcUrl: process.env.POLYGON_ZKEVM_RPC_URL || "https://zkevm-rpc.com",
    name: "Polygon zkEVM",
    mainnet: true,
  },
  ARBITRUM_MAINNET: {
    chainId: 42161,
    rpcUrl: process.env.ARBITRUM_RPC_URL || "https://arb1.arbitrum.io/rpc",
    name: "Arbitrum",
    mainnet: true,
  },
  XDC_MAINNET: {
    chainId: 50,
    rpcUrl: process.env.XDC_RPC_URL || "https://erpc.xinfin.network",
    name: "XinFin",
    mainnet: true,
  },
  // Testnets
  GOERLI: {
    chainId: 5,
    rpcUrl: process.env.GOERLI_RPC_URL || "https://goerli.infura.io/v3",
    name: "Goerli",
    mainnet: false,
  },
  SEPOLIA: {
    chainId: 11155111,
    rpcUrl: process.env.SEPOLIA_RPC_URL || "https://rpc2.sepolia.org",
    name: "Sepolia",
    mainnet: false,
  },
  MUMBAI: {
    chainId: 80001,
    rpcUrl: process.env.MUMBAI_RPC_URL || "https://polygon-testnet.public.blastapi.io",
    name: "Mumbai",
    mainnet: false,
  },
  POLYGON_ZKEVM_TESTNET: {
    chainId: 1442,
    rpcUrl: process.env.POLYGON_ZKEVM_TESTNET_RPC_URL || "https://rpc.public.zkevm-test.net",
    name: "Polygon zkEVM Testnet",
    mainnet: false,
  },
  ARBITRUM_GOERLI: {
    chainId: 421613,
    rpcUrl: process.env.ARBITRUM_GOERLI_RPC_URL || "https://arbitrum-goerli.infura.io/v3/",
    name: "Arbitrum Goerli",
    mainnet: false,
  },
  XDC_APOTHEM: {
    chainId: 51,
    rpcUrl: process.env.XDC_APOTHEM_RPC_URL || "https://erpc.apothem.network",
    name: "XinFin Apothem",
    mainnet: false,
  },
};
