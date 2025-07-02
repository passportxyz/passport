// Mock @reown/appkit/networks
export type AppKitNetwork = {
  id: number;
  name: string;
  network: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  caipNetworkId?: string;
};

// Mock chain definitions
export const mainnet: AppKitNetwork = {
  id: 1,
  name: "Ethereum",
  network: "homestead",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  caipNetworkId: "eip155:1",
};

export const optimism: AppKitNetwork = {
  id: 10,
  name: "Optimism",
  network: "optimism",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  caipNetworkId: "eip155:10",
};

export const sepolia: AppKitNetwork = {
  id: 11155111,
  name: "Sepolia",
  network: "sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  caipNetworkId: "eip155:11155111",
};

export const hardhat: AppKitNetwork = {
  id: 31337,
  name: "Hardhat",
  network: "hardhat",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  caipNetworkId: "eip155:31337",
};

export const optimismSepolia: AppKitNetwork = {
  id: 11155420,
  name: "OP Sepolia Testnet",
  network: "optimism-sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  caipNetworkId: "eip155:11155420",
};

export const scrollSepolia: AppKitNetwork = {
  id: 534351,
  name: "Scroll Sepolia",
  network: "scroll-sepolia",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  caipNetworkId: "eip155:534351",
};

export const polygon: AppKitNetwork = {
  id: 137,
  name: "Polygon",
  network: "polygon",
  nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
  caipNetworkId: "eip155:137",
};

export const fantom: AppKitNetwork = {
  id: 250,
  name: "Fantom",
  network: "fantom",
  nativeCurrency: { name: "Fantom", symbol: "FTM", decimals: 18 },
  caipNetworkId: "eip155:250",
};

export const base: AppKitNetwork = {
  id: 8453,
  name: "Base",
  network: "base",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  caipNetworkId: "eip155:8453",
};

export const linea: AppKitNetwork = {
  id: 59144,
  name: "Linea",
  network: "linea",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  caipNetworkId: "eip155:59144",
};

export const arbitrum: AppKitNetwork = {
  id: 42161,
  name: "Arbitrum One",
  network: "arbitrum",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  caipNetworkId: "eip155:42161",
};

export const zksync: AppKitNetwork = {
  id: 324,
  name: "zkSync",
  network: "zksync",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  caipNetworkId: "eip155:324",
};

export const scroll: AppKitNetwork = {
  id: 534352,
  name: "Scroll",
  network: "scroll",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  caipNetworkId: "eip155:534352",
};

export const avalanche: AppKitNetwork = {
  id: 43114,
  name: "Avalanche",
  network: "avalanche",
  nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
  caipNetworkId: "eip155:43114",
};

export const shape: AppKitNetwork = {
  id: 360,
  name: "Shape",
  network: "shape",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  caipNetworkId: "eip155:360",
};
