import type { SilkEthereumProviderInterface } from "@silk-wallet/silk-wallet-sdk";

// EIP-6963 Type Definitions
interface EIP6963ProviderInfo {
  uuid: string; // UUIDv4 compliant
  name: string; // Human-readable name
  icon: string; // Data URI for icon (96x96px minimum)
  rdns: string; // Reverse DNS identifier
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: SilkEthereumProviderInterface;
}

interface EIP6963AnnounceProviderEvent extends CustomEvent {
  type: "eip6963:announceProvider";
  detail: EIP6963ProviderDetail;
}

interface EIP6963RequestProviderEvent extends Event {
  type: "eip6963:requestProvider";
}

declare global {
  interface WindowEventMap {
    "eip6963:announceProvider": EIP6963AnnounceProviderEvent;
    "eip6963:requestProvider": EIP6963RequestProviderEvent;
  }
}

/**
 * Wraps the Silk provider to handle login automatically when eth_requestAccounts is called
 */
function createWrappedSilkProvider(provider: SilkEthereumProviderInterface): SilkEthereumProviderInterface {
  // Create a wrapped version that intercepts specific methods
  const wrapped = Object.create(provider);

  // Override the request method
  wrapped.request = async function (args: { method: string; params?: any[] }) {
    // Intercept eth_requestAccounts to handle Human Wallet's unique flow
    if (args.method === "eth_requestAccounts") {
      // According to Human Wallet docs, eth_requestAccounts automatically attempts reconnection
      // for users who have previously logged in
      try {
        console.log("Human Wallet: Attempting eth_requestAccounts...");
        const previousAddresses = (await provider.request({ method: "eth_requestAccounts" })) as string[];

        if (!previousAddresses?.length) {
          console.log("Human Wallet: No previous accounts found, attempting login...");
          await (provider as any).login();
        }

        const accounts = await provider.request({ method: "eth_accounts" });
        console.log("Human Wallet: Accounts retrieved:", accounts);
        return accounts;
      } catch (error: any) {
        console.error("Human Wallet: eth_requestAccounts failed:", error);

        // If eth_requestAccounts fails, fall back to login()
        if (error.message?.includes("not been authorized") || error.code === 4001) {
          try {
            await (provider as any).login();
            const accounts = await provider.request({ method: "eth_accounts" });
            return accounts;
          } catch (loginError) {
            console.error("Human Wallet: Login failed", loginError);
            try {
              await (provider as any).logout();
            } catch {}
            throw loginError;
          }
        }

        throw error;
      }
    }

    // For all other methods, pass through
    return provider.request(args);
  };

  // Make sure all other methods and properties are accessible
  // This ensures event emitters and other functionality work correctly
  return wrapped as SilkEthereumProviderInterface;
}

/**
 * Announces the Silk/Human Wallet provider following EIP-6963 standard
 * This allows dApps to discover the wallet through the standard event system
 */
export function announceSilkProvider(provider: SilkEthereumProviderInterface): () => void {
  // Wrap the provider to handle login automatically
  const wrappedProvider = createWrappedSilkProvider(provider);

  const info: EIP6963ProviderInfo = {
    uuid: crypto.randomUUID(), // Generate a new UUIDv4 for each session per EIP-6963 spec
    name: "Human Wallet (Beta)",
    icon: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9Ii02LjI1IC0yLjUgNDQgNDQiPgogIDxyZWN0IHg9Ii02LjI1IiB5PSItMi41IiB3aWR0aD0iNDQiIGhlaWdodD0iNDQiIGZpbGw9IndoaXRlIi8+CiAgPHBhdGgKICAgIGQ9Ik0gMjUuMDE0IDI5Ljk0OCBDIDExLjgzOSAyOS42NDQgMTYuNTExIDExLjAxNSAyLjk4OCAxMS42OTUgQyAyLjkxNSAxMS42OTcgMi44NDYgMTEuNzI3IDIuNzk0IDExLjc3OSBMIDAuMTIyIDE0LjQ1NiBDIDAuMDQyIDE0LjUzOSAwLjAxOCAxNC42NjMgMC4wNjMgMTQuNzcgQyAwLjEwOCAxNC44NzcgMC4yMTIgMTQuOTQ3IDAuMzI3IDE0Ljk0NyBDIDEzLjI4NSAxNC44NTUgOC42NDIgMzMuNDUyIDIyLjMxNiAzMy4yMjEgQyAyMi4zOTIgMzMuMjIgMjIuNDY1IDMzLjE4OSAyMi41MTggMzMuMTM0IEwgMjUuMjEgMzAuNDM5IEMgMjUuMjkgMzAuMzU3IDI1LjMxNCAzMC4yMzYgMjUuMjcxIDMwLjEzIEMgMjUuMjI5IDMwLjAyMyAyNS4xMjggMjkuOTUyIDI1LjAxNCAyOS45NDggWiIKICAgIGZpbGw9InJnYigwLDAsMCkiCiAgPjwvcGF0aD4KICA8cGF0aAogICAgZD0iTSAzMC43ODQgMjQuMTY4IEMgMTcuNjA3IDIzLjg3OSAyMi4yNzggNS4yMzUgOC43NTUgNS45MTIgQyA4LjY4MyA1LjkxNyA4LjYxNCA1Ljk0OCA4LjU2MiA1Ljk5OSBMIDUuODkzIDguNjczIEMgNS44MSA4Ljc1NiA1Ljc4NSA4Ljg4MSA1LjgzIDguOTg5IEMgNS44NzUgOS4wOTggNS45ODEgOS4xNjggNi4wOTggOS4xNjggQyAxOS4wNTkgOS4wNzUgMTQuNDEzIDI3LjY3MiAyOC4wOSAyNy40NDEgQyAyOC4xNjUgMjcuNDM3IDI4LjIzNyAyNy40MDcgMjguMjkyIDI3LjM1NCBMIDMwLjk4IDI0LjY2IEMgMzEuMDYxIDI0LjU3OCAzMS4wODUgMjQuNDU2IDMxLjA0MyAyNC4zNDkgQyAzMSAyNC4yNDMgMzAuODk5IDI0LjE3MiAzMC43ODQgMjQuMTY4IFoiCiAgICBmaWxsPSJyZ2IoMCwwLDApIgogID48L3BhdGg+CiAgPHBhdGgKICAgIGQ9Ik0gMTEuODY5IDMuMzg1IEMgMTguNTY1IDMuMzM5IDIwLjU2MiA4LjI3NyAyMi44MTUgMTMuMDM0IEMgMjIuODU1IDEzLjExOCAyMi45MzQgMTMuMTc5IDIzLjAyNyAxMy4xOTUgQyAyMy4xMTkgMTMuMjExIDIzLjIxMyAxMy4xODEgMjMuMjggMTMuMTE0IEwgMjYuMTEgMTAuMjc1IEMgMjYuMTk2IDEwLjE4OSAyNi4yMTkgMTAuMDU4IDI2LjE2OCA5Ljk0OCBDIDIzLjgxMSA0Ljk5NiAyMS44MDIgLTAuMjMyIDE0LjUyMyAwLjEzMiBDIDE0LjQ1IDAuMTM1IDE0LjM4MSAwLjE2NiAxNC4zMyAwLjIxOSBMIDExLjY2IDIuODk0IEMgMTEuNTc5IDIuOTc3IDExLjU1NSAzLjEwMSAxMS42MDEgMy4yMDkgQyAxMS42NDYgMy4zMTcgMTEuNzUyIDMuMzg2IDExLjg2OCAzLjM4NSBaIE0gMTkuMjQ2IDM1LjcyNyBDIDEyLjU4NyAzNS41NzQgMTAuNDg2IDMwLjc0IDguMjgyIDI2LjA4MiBDIDguMjQxIDI2LjAwMSA4LjE2NSAyNS45NDUgOC4wNzYgMjUuOTI5IEMgNy45ODcgMjUuOTEzIDcuODk1IDI1Ljk0MCA3LjgyOSAyNi4wMDEgTCA0Ljk5OSAyOC44MzggQyA0LjkxMSAyOC45MjQgNC44ODggMjkuMDU2IDQuOTQxIDI5LjE2NyBDIDcuMjMyIDM0LjAxIDkuMzUgMzkuMTE5IDE2LjU1NyAzOC45OTggQyAxNi42MzMgMzguOTk2IDE2LjcwNiAzOC45NjUgMTYuNzU5IDM4LjkxMSBMIDE5LjQ0OCAzNi4yMTYgQyAxOS41MjcgMzYuMTMzIDE5LjU0OSAzNi4wMTIgMTkuNTA2IDM1LjkwNiBDIDE5LjQ2MiAzNS44IDE5LjM2IDM1LjczIDE5LjI0NiAzNS43MjcgWiIKICAgIGZpbGw9InJnYigwLDAsMCkiCiAgPjwvcGF0aD4KPC9zdmc+",
    rdns: "tech.human.wallet", // Reverse DNS for Human Wallet
  };

  const detail: EIP6963ProviderDetail = {
    info: Object.freeze(info),
    provider: wrappedProvider,
  };

  // Function to announce the provider
  const announceProvider = () => {
    const event = new CustomEvent("eip6963:announceProvider", {
      detail: Object.freeze(detail),
    });
    window.dispatchEvent(event);
  };

  // Announce immediately
  announceProvider();

  // Listen for request events and re-announce
  const handleRequest = () => announceProvider();
  window.addEventListener("eip6963:requestProvider", handleRequest);

  // Return cleanup function
  return () => {
    window.removeEventListener("eip6963:requestProvider", handleRequest);
  };
}

/**
 * Request all EIP-6963 compatible providers
 * This is useful for dApps to discover all available wallets
 */
export function requestProviders(callback: (providerDetail: EIP6963ProviderDetail) => void): () => void {
  const handleAnnounce = (event: EIP6963AnnounceProviderEvent) => {
    callback(event.detail);
  };

  window.addEventListener("eip6963:announceProvider", handleAnnounce);
  window.dispatchEvent(new Event("eip6963:requestProvider"));

  return () => {
    window.removeEventListener("eip6963:announceProvider", handleAnnounce);
  };
}

/**
 * Example of how to integrate EIP-6963 announcement with Silk initialization
 */
export function initSilkWithEIP6963(silkProvider: SilkEthereumProviderInterface): () => void {
  // Announce the provider via EIP-6963
  // const cleanup = announceSilkProvider(silkProvider);

  // Don't assign to window.ethereum - let users connect via EIP-6963 discovery
  // This prevents conflicts with other wallets

  // return cleanup;

  // Return empty cleanup function since we're not announcing the provider
  return () => {};
}
