import { TEST_MODE } from "../context/testModeState";
import {
  AttestationProvider,
  AttestationProviderConfig,
  EASAttestationProvider,
  VeraxAndEASAttestationProvider,
} from "./AttestationProvider";

// RPC urls
export const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_PASSPORT_MAINNET_RPC_URL as string;

const sepoliaChainId = "0xaa36a7";
const hardhatChainId = "0x7a69";
const lineaChainId = "0xe708";
const lineaGoerliChainId = "0xe704";
const optimismChainId = "0xa";
const zkSyncChainId = "0x144";
const sepoliaOPChainId = "0xaa37dc";
const arbitrumChainId = "0xa4b1";
const scrollChainId = "0x82750";
const shapeChainId = "0x168";

type ChainConfig = {
  id: string;
  token: string;
  label: string;
  rpcUrl: string;
  icon: string;
  chainLink: string; // Link to which to redirect if a user clicks the chain icon in the footer for example
  explorerUrl: string;
  attestationProviderConfig?: AttestationProviderConfig;
  useCustomCommunityId?: boolean;
};

export class Chain {
  id: string;
  token: string;
  label: string;
  rpcUrl: string;
  explorerUrl: string;
  icon: string;
  chainLink: string; // Link to which to redirect if a user clicks the chain icon in the footer for example
  attestationProvider?: AttestationProvider;
  useCustomCommunityId?: boolean;

  constructor({
    id,
    token,
    label,
    rpcUrl,
    explorerUrl,
    icon,
    attestationProviderConfig,
    chainLink,
    useCustomCommunityId,
  }: ChainConfig) {
    this.id = id;
    this.token = token;
    this.label = label;
    this.rpcUrl = rpcUrl;
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
    rpcUrl: MAINNET_RPC_URL,
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
    rpcUrl: process.env.NEXT_PUBLIC_PASSPORT_SEPOLIA_RPC_URL as string,
    explorerUrl: "https://sepolia.etherscan.io",
    icon: "./assets/eth-network-logo.svg",
    chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
  });
  chainConfigs.push({
    id: hardhatChainId,
    token: "ETH",
    label: "Hardhat",
    rpcUrl: "http://127.0.0.1:8545/",
    explorerUrl: "",
    icon: "./assets/eth-network-logo.svg",
    chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
  });

  chainConfigs.push({
    id: sepoliaOPChainId,
    token: "ETH",
    label: "OP Sepolia Testnet",
    rpcUrl: "https://sepolia.optimism.io",
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
}

if (!TEST_MODE) {
  if (process.env.NEXT_PUBLIC_FF_MULTICHAIN_SIGNATURE === "on") {
    chainConfigs.push({
      id: "0x89",
      token: "MATIC",
      label: "Polygon Mainnet",
      rpcUrl: "https://matic-mainnet.chainstacklabs.com",
      explorerUrl: "https://polygonscan.com",
      icon: "./assets/eth-network-logo.svg",
      chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
    });
    chainConfigs.push({
      id: "0xfa",
      token: "FTM",
      label: "Fantom Mainnet",
      rpcUrl: "https://rpc.ftm.tools/",
      explorerUrl: "https://ftmscan.com",
      icon: "./assets/eth-network-logo.svg",
      chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
    });
  }

  chainConfigs.push({
    id: optimismChainId,
    token: "ETH",
    label: "Optimism",
    rpcUrl: process.env.NEXT_PUBLIC_PASSPORT_OP_RPC_URL as string,
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

  if (process.env.NEXT_PUBLIC_FF_ONCHAIN_ZKSYNC === "on") {
    chainConfigs.push({
      id: zkSyncChainId,
      token: "ETH",
      label: "zkSync",
      rpcUrl: process.env.NEXT_PUBLIC_PASSPORT_ZKSYNC_RPC_URL as string,
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
  }

  chainConfigs.push({
    id: lineaChainId,
    token: "ETH",
    label: "Linea",
    rpcUrl: "https://rpc.linea.build",
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

  chainConfigs.push({
    id: "0xa86a",
    token: "AVAX",
    label: "Avalanche",
    rpcUrl: "https://api.avax.network/ext/bc/C/rpc",
    explorerUrl: "https://subnets.avax.network/",
    icon: "./assets/avax-logo.svg",
    chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
  });

  chainConfigs.push({
    id: arbitrumChainId,
    token: "ETH",
    label: "Arbitrum One",
    // rpcUrl: "https://arb1.arbitrum.io/rpc",
    rpcUrl: process.env.NEXT_PUBLIC_PASSPORT_ARB_RPC_URL as string,
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

  if (process.env.NEXT_PUBLIC_FF_ONCHAIN_SCROLL === "on") {
    chainConfigs.push({
      id: scrollChainId,
      token: "ETH",
      label: "Scroll",
      rpcUrl: process.env.NEXT_PUBLIC_PASSPORT_SCROLL_RPC_URL as string,
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
  }

  if (process.env.NEXT_PUBLIC_FF_ONCHAIN_SHAPE === "on") {
    chainConfigs.push({
      id: shapeChainId,
      token: "ETH",
      label: "Shape",
      rpcUrl: process.env.NEXT_PUBLIC_PASSPORT_SHAPE_RPC_URL as string,
      explorerUrl: "https://shape.com/",
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
  }
}

export const chains: Chain[] = chainConfigs.map((config) => new Chain(config));
