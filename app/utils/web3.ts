import { createConfig } from "wagmi";
import { coinbaseWallet, injected } from "wagmi/connectors";
import { wagmiChains, wagmiTransports } from "./chains";
import { waapConnector } from "./waap";

const metadata = {
  name: "Passport",
  icons: ["/assets/onboarding.svg"],
};

// Plain wagmi config. Connectors: WaaP (Human Wallet) for email/social sign-in; injected for browser
// extensions (EIP-6963 discovery adds one per installed wallet); Coinbase Wallet. The "Connect your
// wallet" picker (components/WalletPicker) lists them.
// No WalletConnect connector: its QR window loads its own Reown AppKit, which takes the <w3m-modal>
// element the WaaP SDK's AppKit needs for wallet linking. Linking still offers WalletConnect.
export const wagmiConfig = createConfig({
  chains: wagmiChains,
  transports: wagmiTransports,
  connectors: [waapConnector, injected(), coinbaseWallet({ appName: metadata.name, appLogoUrl: metadata.icons[0] })],
  ssr: true,
});
