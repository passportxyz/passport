import { init } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import ledgerModule from "@web3-onboard/ledger";
import walletConnectModule, { WalletConnectOptions } from "@web3-onboard/walletconnect";
import { InitOptions } from "@web3-onboard/core";

// RPC urls
const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_PASSPORT_MAINNET_RPC_URL as string;

// // Injected wallet - shows all available injected wallets

const injected = injectedModule();

// web3Onboard modules

const walletConnectOptions: WalletConnectOptions = {
  projectId: (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string) || "default-project-id",
};

const onBoardExploreUrl =
  (process.env.NEXT_PUBLIC_WEB3_ONBOARD_EXPLORE_URL as string) || "https://passport.gitcoin.co/";

const walletConnect = walletConnectModule(walletConnectOptions);
// Include ledger capabilities
const ledger = ledgerModule();

export const sepoliaChainId = "0xaa36a7";
export const hardhatChainId = "0x7a69";

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
    id: sepoliaChainId,
    token: "ETH",
    label: "Sepolia",
    rpcUrl: process.env.NEXT_PUBLIC_PASSPORT_SEPOLIA_RPC_URL as string,
  });
  chains.push({
    id: hardhatChainId,
    token: "ETH",
    label: "Hardhat",
    rpcUrl: "http://127.0.0.1:8545/",
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
console.log({ onBoardExploreUrl });
// Exports onboard-core instance (https://github.com/blocknative/web3-onboard)
export const initWeb3Onboard = init({
  wallets: [injected, ledger, walletConnect],
  chains: chains,
  appMetadata: {
    name: "Passport",
    icon: "/assets/gitcoinLogo.svg",
    logo: "/assets/gitcoinLogo.svg",
    description: "Decentralized Identity Verification",
    explore: onBoardExploreUrl,
    recommendedInjectedWallets: [
      { name: "Coinbase", url: "https://wallet.coinbase.com/" },
      { name: "MetaMask", url: "https://metamask.io" },
    ],
  },
});
