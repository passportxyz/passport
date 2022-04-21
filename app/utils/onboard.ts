import { init } from "@web3-onboard/react";
import injectedModule from "@web3-onboard/injected-wallets";
import ledgerModule from "@web3-onboard/ledger";
import walletConnectModule from "@web3-onboard/walletconnect";
import walletLinkModule from "@web3-onboard/walletlink";

// RPC urls
const MAINNET_RPC_URL = `https://mainnet.infura.io/v3/${
  // process.env.DPOPP_INFURA_KEY
  "460f40a260564ac4a4f4b3fffb032dad"
}`;
const RINKEBY_RPC_URL = `https://rinkeby.infura.io/v3/${
  // process.env.DPOPP_INFURA_KEY
  "460f40a260564ac4a4f4b3fffb032dad"
}`;

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
    {
      id: "0x4",
      token: "ETH",
      label: "Ethereum Rinkeby Testnet",
      rpcUrl: RINKEBY_RPC_URL,
    },
  ],
  appMetadata: {
    name: "Gitcoin - dPopp",
    icon: "/src/assets/dpoppLogo.svg",
    logo: "/src/assets/dpoppLogo.svg",
    description: "Decentralise Proof of Personhood Passport",
    recommendedInjectedWallets: [
      { name: "Coinbase", url: "https://wallet.coinbase.com/" },
      { name: "MetaMask", url: "https://metamask.io" },
    ],
  },
});
