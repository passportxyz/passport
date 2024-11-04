import { networks } from "./chains";

import { createAppKit } from "@reown/appkit/react";
import { EthersAdapter } from "@reown/appkit-adapter-ethers";

const projectId = (process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string) || "default-project-id";

const metadata = {
  name: "Passport",
  description: "Decentralized Identity Verification",
  url: "http://localhost:3000/",
  icons: ["/assets/onboarding.svg"],
};

// const ethersConfig = defaultConfig({
//   metadata,
//   defaultChainId: 1,
//   auth: {
//     email: false,
//   },
// });

export const web3Modal = createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  metadata,
  projectId,
  themeMode: "dark",
  themeVariables: {
    "--w3m-font-family": "var(--font-body)",
    "--w3m-accent": "rgb(var(--color-foreground-4))",
  },
  enableEIP6963: false,
  features: {
    email: false,
    socials: [],
    emailShowWallets: false,
  },
});
