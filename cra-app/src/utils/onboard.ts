import { init } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import ledgerModule from "@web3-onboard/ledger";
import walletConnectModule from "@web3-onboard/walletconnect";
import walletLinkModule from "@web3-onboard/walletlink";

// RPC urls
const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_DPOPP_MAINNET_RPC_URL as string;

// Injected wallet
const injected = injectedModule();
// web3Oboard modules
const walletLink = walletLinkModule();
const walletConnect = walletConnectModule();
// Include ledger capabilities
const ledger = ledgerModule();

// Exports onboard-core instance (https://github.com/blocknative/web3-onboard)
export const initWeb3Onboard = init({
  wallets: [injected, ledger, walletLink, walletConnect],
  chains: [
    {
      id: "0x1",
      token: "ETH",
      label: "Ethereum Mainnet",
      rpcUrl: MAINNET_RPC_URL,
    },
  ],
  appMetadata: {
    name: "Passport",
    icon: "/assets/GitcoinLogo.svg",
    logo: "/assets/GitcoinLogo.svg",
    description: "Decentralized Identity Verification",
    recommendedInjectedWallets: [
      { name: "Coinbase", url: "https://wallet.coinbase.com/" },
      { name: "MetaMask", url: "https://metamask.io" },
    ],
  },
});
