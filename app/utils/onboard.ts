import { init } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import ledgerModule from "@web3-onboard/ledger";
import walletConnectModule from "@web3-onboard/walletconnect";
import walletLinkModule from "@web3-onboard/walletlink";

// RPC urls
const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_PASSPORT_MAINNET_RPC_URL as string;

// Injected wallet
const injected = injectedModule();
// web3Oboard modules
const walletLink = walletLinkModule();
const walletConnect = walletConnectModule();
// Include ledger capabilities
const ledger = ledgerModule();

const chains = [
  {
    id: "0x1",
    token: "ETH",
    label: "Ethereum Mainnet",
    rpcUrl: MAINNET_RPC_URL,
  },
];

if (process.env.NEXT_PUBLIC_ENABLE_TESTNET === "on") {
  chains.push({
    id: "0xaa36a7",
    token: "ETH",
    label: "Sepolia",
    rpcUrl: process.env.NEXT_PUBLIC_PASSPORT_SEPOLIA_RPC_URL as string,
  });
}

if (process.env.NEXT_PUBLIC_FF_MULTICHAIN_SIGNATURE === "on") {
  chains.push({
    id: "0x89",
    token: "MATIC",
    label: "Polygon Mainnet",
    rpcUrl: "https://matic-mainnet.chainstacklabs.com",
  });
  chains.push({
    id: "0xfa",
    token: "FTM",
    label: "Fantom Mainnet",
    rpcUrl: "https://rpc.ftm.tools/",
  });
}

// Exports onboard-core instance (https://github.com/blocknative/web3-onboard)
export const initWeb3Onboard = init({
  wallets: [injected, ledger, walletLink, walletConnect],
  chains: chains,
  appMetadata: {
    name: "Passport",
    icon: "/assets/gitcoinLogo.svg",
    logo: "/assets/gitcoinLogo.svg",
    description: "Decentralized Identity Verification",
    recommendedInjectedWallets: [
      { name: "Coinbase", url: "https://wallet.coinbase.com/" },
      { name: "MetaMask", url: "https://metamask.io" },
    ],
  },
});
