import { init } from "@web3-onboard/react";
import injectedModule, { ProviderLabel } from "@web3-onboard/injected-wallets";
import ledgerModule from "@web3-onboard/ledger";
import walletConnectModule from "@web3-onboard/walletconnect";

// RPC urls
const MAINNET_RPC_URL = process.env.NEXT_PUBLIC_PASSPORT_MAINNET_RPC_URL as string;

// // Injected wallet opt1
const injected = injectedModule();

// Injected wallet opt2
// const injected = injectedModule({
//   // display all wallets even if they are unavailable
//   displayUnavailable: true,
//   // but only show wallets if they are available
//   filter: {
//     [ProviderLabel.AlphaWallet]: "unavailable",
//     [ProviderLabel.ApexWallet]: "unavailable",
//     [ProviderLabel.AToken]: "unavailable",
//     [ProviderLabel.BifrostWallet]: "unavailable",
//     [ProviderLabel.Binance]: "unavailable",
//     [ProviderLabel.Bitski]: "unavailable",
//     [ProviderLabel.BlockWallet]: "unavailable",
//     [ProviderLabel.Brave]: "unavailable",
//     [ProviderLabel.Dcent]: "unavailable",
//     [ProviderLabel.Exodus]: "unavailable",
//     [ProviderLabel.Frame]: "unavailable",
//     [ProviderLabel.Frontier]: "unavailable",
//     [ProviderLabel.HuobiWallet]: "unavailable",
//     [ProviderLabel.HyperPay]: "unavailable",
//     [ProviderLabel.ImToken]: "unavailable",
//     [ProviderLabel.InfinityWallet]: "unavailable",
//     [ProviderLabel.Liquality]: "unavailable",
//     [ProviderLabel.MeetOne]: "unavailable",
//     [ProviderLabel.MyKey]: "unavailable",
//     [ProviderLabel.Opera]: "unavailable",
//     [ProviderLabel.OwnBit]: "unavailable",
//     [ProviderLabel.Status]: "unavailable",
//     [ProviderLabel.Trust]: "unavailable",
//     [ProviderLabel.TokenPocket]: "unavailable",
//     [ProviderLabel.TP]: "unavailable",
//     [ProviderLabel.WalletIo]: "unavailable",
//     [ProviderLabel.XDEFI]: "unavailable",
//     [ProviderLabel.OneInch]: "unavailable",
//     [ProviderLabel.Tokenary]: "unavailable",
//     [ProviderLabel.Tally]: "unavailable",
//     [ProviderLabel.Rabby]: "unavailable",
//     [ProviderLabel.MathWallet]: "unavailable",
//     [ProviderLabel.GameStop]: "unavailable",
//     [ProviderLabel.BitKeep]: "unavailable",
//     [ProviderLabel.Sequence]: "unavailable",
//     [ProviderLabel.Core]: "unavailable",
//     [ProviderLabel.Enkrypt]: "unavailable",
//     [ProviderLabel.Zeal]: "unavailable",
//     [ProviderLabel.Phantom]: "unavailable",
//     [ProviderLabel.Zerion]: "unavailable",
//     [ProviderLabel.Rainbow]: "unavailable",
//     [ProviderLabel.SafePal]: "unavailable",
//     [ProviderLabel.DeFiWallet]: "unavailable",
//     [ProviderLabel.Safeheron]: "unavailable",
//     [ProviderLabel.Talisman]: "unavailable",
//   },
//   // do a manual sort of injected wallets so that MetaMask and Coinbase are ordered first
//   sort: (wallets) => {
//     const coinbase = wallets.find(({ label }) => label === ProviderLabel.Coinbase);
//     const okxwallet = wallets.find(({ label }) => label === ProviderLabel.OKXWallet);

//     return (
//       [coinbase, okxwallet, ...wallets]
//         // remove undefined values
//         .filter((wallet) => wallet)
//     );
//   },
// });

// web3Onboard modules
const walletConnect = walletConnectModule();
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

// Exports onboard-core instance (https://github.com/blocknative/web3-onboard)
export const initWeb3Onboard = init({
  wallets: [injected, ledger, walletConnect],
  chains: chains,
  appMetadata: {
    name: "Passport",
    icon: "/assets/gitcoinLogo.svg",
    logo: "/assets/gitcoinLogo.svg",
    description: "Decentralized Identity Verification",
  },
});
