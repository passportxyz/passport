import { chains, MAINNET_RPC_URL } from "./chains";

import { createWeb3Modal, defaultConfig } from "@web3modal/ethers/react";

const projectId = (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string) || "default-project-id";

const web3modalChains = chains.map(({ id, token, label, rpcUrl, explorerUrl }) => ({
  chainId: parseInt(id, 16),
  name: label,
  currency: token,
  rpcUrl,
  explorerUrl,
}));

const metadata = {
  name: "Passport",
  description: "Decentralized Identity Verification",
  url: "https://passport.gitcoin.co",
  icons: ["/assets/onboarding.svg"],
};

const ethersConfig = defaultConfig({
  metadata,
  rpcUrl: MAINNET_RPC_URL,
  defaultChainId: 1,
  auth: {
    email: false,
  },
});

createWeb3Modal({
  ethersConfig,
  chains: web3modalChains,
  projectId,
  // TODO
  // themeMode: "dark",
  themeVariables: {
    "--w3m-font-family": "var(--font-body)",
    //   "--w3m-accent": "rgb(var(--color-foreground-4))",
  },
});
