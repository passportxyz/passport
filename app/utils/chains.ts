import { CaipNetwork } from "@reown/appkit";
import { TEST_MODE } from "../context/testModeState";
import {
  AttestationProvider,
  AttestationProviderConfig,
  EASAttestationProvider,
  VeraxAndEASAttestationProvider,
} from "./AttestationProvider";

import {
  arbitrum,
  mainnet,
  sepolia,
  hardhat,
  optimismSepolia,
  scrollSepolia,
  polygon,
  fantom,
  optimism,
  zksync,
  linea,
  avalanche,
  scroll,
  shape,
  type AppKitNetwork,
} from "@reown/appkit/networks";
import { Config } from "wagmi";
import { http, HttpTransport } from "viem";

// Type matches the library, forces at least 1 element
export const wagmiChains: [AppKitNetwork, ...AppKitNetwork[]] = [mainnet];
export let wagmiTransports: Record<Config["chains"][number]["id"], HttpTransport> = {};

const sepoliaChainId = "0xaa36a7";
const hardhatChainId = "0x7a69";
const lineaChainId = "0xe708";
const optimismChainId = "0xa";
const zkSyncChainId = "0x144";
const sepoliaOPChainId = "0xaa37dc";
const arbitrumChainId = "0xa4b1";
export const scrollChainId = "0x82750";
const shapeChainId = "0x168";

export type ChainId = `0x${string}`;

type ChainConfig = {
  id: ChainId;
  token: string;
  label: string;
  icon: string;
  chainLink: string; // Link to which to redirect if a user clicks the chain icon in the footer for example
  explorerUrl: string;
  attestationProviderConfig?: AttestationProviderConfig;
  useCustomCommunityId?: boolean;
};

export class Chain {
  id: ChainId;
  token: string;
  label: string;
  explorerUrl: string;
  icon: string;
  chainLink: string; // Link to which to redirect if a user clicks the chain icon in the footer for example
  attestationProvider?: AttestationProvider;
  useCustomCommunityId?: boolean;

  constructor({
    id,
    token,
    label,
    explorerUrl,
    icon,
    attestationProviderConfig,
    chainLink,
    useCustomCommunityId,
  }: ChainConfig) {
    this.id = id;
    this.token = token;
    this.label = label;
    this.icon = icon;
    this.explorerUrl = explorerUrl;
    this.chainLink = chainLink;
    this.useCustomCommunityId = useCustomCommunityId;

    if (attestationProviderConfig) {
      const attestationConfig = { ...attestationProviderConfig, chainId: this.id };
      switch (attestationConfig.name) {
        case "Ethereum Attestation Service":
          this.attestationProvider = new EASAttestationProvider(attestationConfig);
          break;
        case "Verax + EAS":
          this.attestationProvider = new VeraxAndEASAttestationProvider(attestationConfig);
          break;
        default:
          break;
      }
    }
  }
}

const chainConfigs: ChainConfig[] = [
  {
    id: "0x1",
    token: "ETH",
    label: "Ethereum Mainnet",
    icon: "./assets/eth-network-logo.svg",
    chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
    explorerUrl: "https://etherscan.io",
  },
];

const usingTestEnvironment = process.env.NEXT_PUBLIC_ENABLE_TESTNET === "on" || TEST_MODE;

if (usingTestEnvironment) {
  chainConfigs.push({
    id: sepoliaChainId,
    token: "ETH",
    label: "Sepolia",
    explorerUrl: "https://sepolia.etherscan.io",
    icon: "./assets/eth-network-logo.svg",
    chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
  });
  wagmiChains.push(sepolia);
  wagmiTransports[sepolia.id] = http(process.env.NEXT_PUBLIC_PASSPORT_SEPOLIA_RPC_URL);

  chainConfigs.push({
    id: hardhatChainId,
    token: "ETH",
    label: "Hardhat",
    explorerUrl: "",
    icon: "./assets/eth-network-logo.svg",
    chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
  });
  wagmiChains.push(hardhat);
  wagmiTransports[hardhat.id] = http("http://127.0.0.1:8545/");

  chainConfigs.push({
    id: sepoliaOPChainId,
    token: "ETH",
    label: "OP Sepolia Testnet",
    explorerUrl: "https://sepolia-optimism.etherscan.io/",
    icon: "./assets/op-logo.svg",
    chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
    attestationProviderConfig: {
      name: "Ethereum Attestation Service",
      status: "enabled",
      skipByDefault: false,
      easScanUrl: "https://optimism-sepolia.easscan.org",
      monochromeIcon: "./assets/op-logo-monochrome.svg",
    },
  });
  wagmiChains.push(optimismSepolia);
  wagmiTransports[optimismSepolia.id] = http("https://sepolia.optimism.io");

  chainConfigs.push({
    id: "0x8274f",
    token: "ETH",
    label: "Scroll Sepolia",
    explorerUrl: "https://sepolia.scrollscan.com/",
    icon: "./assets/scroll-logo.svg",
    chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
    attestationProviderConfig: {
      name: "Ethereum Attestation Service",
      status: "enabled",
      skipByDefault: false,
      easScanUrl: "https://scroll-sepolia.easscan.org",
      monochromeIcon: "./assets/scroll-logo-monochrome.svg",
    },
  });
  wagmiChains.push(scrollSepolia);
  wagmiTransports[scrollSepolia.id] = http(process.env.NEXT_PUBLIC_PASSPORT_SCROLL_SEPOLIA_RPC_URL);
}

if (!TEST_MODE) {
  if (process.env.NEXT_PUBLIC_FF_MULTICHAIN_SIGNATURE === "on") {
    chainConfigs.push({
      id: "0x89",
      token: "MATIC",
      label: "Polygon Mainnet",
      explorerUrl: "https://polygonscan.com",
      icon: "./assets/eth-network-logo.svg",
      chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
    });
    wagmiChains.push(polygon);
    wagmiTransports[polygon.id] = http("https://matic-mainnet.chainstacklabs.com");

    chainConfigs.push({
      id: "0xfa",
      token: "FTM",
      label: "Fantom Mainnet",
      explorerUrl: "https://ftmscan.com",
      icon: "./assets/eth-network-logo.svg",
      chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
    });
    wagmiChains.push(fantom);
    wagmiTransports[fantom.id] = http("https://rpc.ftm.tools/");
  }

  chainConfigs.push({
    id: optimismChainId,
    token: "ETH",
    label: "Optimism",
    explorerUrl: "https://optimistic.etherscan.io",
    icon: "./assets/op-logo.svg",
    chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
    attestationProviderConfig: {
      name: "Ethereum Attestation Service",
      status: usingTestEnvironment ? "disabled" : "enabled",
      skipByDefault: false,
      easScanUrl: "https://optimism.easscan.org",
      monochromeIcon: "./assets/op-logo-monochrome.svg",
    },
  });
  wagmiChains.push(optimism);
  wagmiTransports[optimism.id] = http(process.env.NEXT_PUBLIC_PASSPORT_OP_RPC_URL);

  if (process.env.NEXT_PUBLIC_FF_ONCHAIN_ZKSYNC === "on") {
    chainConfigs.push({
      id: zkSyncChainId,
      token: "ETH",
      label: "zkSync",
      icon: "./assets/zksyncStampIcon.svg",
      chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
      explorerUrl: "https://explorer.zksync.io/",
      attestationProviderConfig: {
        name: "Ethereum Attestation Service",
        status: usingTestEnvironment ? "disabled" : "enabled",
        skipByDefault: false,

        easScanUrl: "https://zksync.easscan.org",
        monochromeIcon: "./assets/zksync-logo-monochrome.svg",
      },
    });
    wagmiChains.push(zksync);
    wagmiTransports[zksync.id] = http(process.env.NEXT_PUBLIC_PASSPORT_ZKSYNC_RPC_URL);
  }

  chainConfigs.push({
    id: lineaChainId,
    token: "ETH",
    label: "Linea",
    explorerUrl: "https://lineascan.build/",
    icon: "./assets/linea-logo.png",
    chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
    attestationProviderConfig: {
      name: "Verax + EAS",
      status: "enabled",
      skipByDefault: false,
      easScanUrl: "https://explorer.ver.ax/linea/attestations/my_attestations",
      monochromeIcon: "./assets/linea-logo.png",
    },
  });
  wagmiChains.push(linea);
  wagmiTransports[linea.id] = http("https://rpc.linea.build");

  chainConfigs.push({
    id: "0xa86a",
    token: "AVAX",
    label: "Avalanche",
    explorerUrl: "https://subnets.avax.network/",
    icon: "./assets/avax-logo.svg",
    chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
  });
  wagmiChains.push(avalanche);
  wagmiTransports[avalanche.id] = http("https://api.avax.network/ext/bc/C/rpc");

  chainConfigs.push({
    id: arbitrumChainId,
    token: "ETH",
    label: "Arbitrum One",
    explorerUrl: "https://arbiscan.io/",
    icon: "./assets/arbitrum-arb-logo.svg",
    chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
    attestationProviderConfig: {
      name: "Ethereum Attestation Service",
      status: usingTestEnvironment ? "disabled" : "enabled",
      skipByDefault: false,
      easScanUrl: "https://arbitrum.easscan.org",
      monochromeIcon: "./assets/arbitrum-logo-monochrome.svg",
    },
  });
  wagmiChains.push(arbitrum);
  wagmiTransports[arbitrum.id] = http(process.env.NEXT_PUBLIC_PASSPORT_ARB_RPC_URL);

  if (process.env.NEXT_PUBLIC_FF_ONCHAIN_SCROLL === "on") {
    chainConfigs.push({
      id: scrollChainId,
      token: "ETH",
      label: "Scroll",
      explorerUrl: "https://scrollscan.com/",
      icon: "./assets/scroll-logo.svg",
      chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
      attestationProviderConfig: {
        name: "Ethereum Attestation Service",
        status: usingTestEnvironment ? "disabled" : "enabled",
        skipByDefault: false,
        easScanUrl: "https://scroll.easscan.org",
        monochromeIcon: "./assets/scroll-logo-monochrome.svg",
      },
    });
    wagmiChains.push(scroll);
    wagmiTransports[scroll.id] = http(process.env.NEXT_PUBLIC_PASSPORT_SCROLL_RPC_URL);
  }

  if (process.env.NEXT_PUBLIC_FF_ONCHAIN_SHAPE === "on") {
    chainConfigs.push({
      id: shapeChainId,
      token: "ETH",
      label: "Shape",
      explorerUrl: "https://shapescan.xyz/",
      icon: "./assets/shape-logo.svg",
      chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport/",
      attestationProviderConfig: {
        name: "Ethereum Attestation Service",
        status: usingTestEnvironment ? "disabled" : "enabled",
        skipByDefault: true,
        easScanUrl: undefined,
        monochromeIcon: "./assets/shape-logo.svg",
      },
      useCustomCommunityId: true,
    });
    wagmiChains.push(shape);
    wagmiTransports[shape.id] = http(process.env.NEXT_PUBLIC_PASSPORT_SHAPE_RPC_URL);
  }
}

// Need to use the more restrictive "CaipNetwork" type in some places
export const networkMap = wagmiChains
  .filter((network): network is CaipNetwork => (network as CaipNetwork).caipNetworkId !== undefined)
  .reduce(
    (acc, network) => {
      acc[network.id] = network;
      return acc;
    },
    {} as Record<string, CaipNetwork>
  );

export const chains: Chain[] = chainConfigs.map((config) => new Chain(config));
