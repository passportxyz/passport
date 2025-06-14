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
 * Announces the Silk/Human Wallet provider following EIP-6963 standard
 * This allows dApps to discover the wallet through the standard event system
 */
export function announceSilkProvider(provider: SilkEthereumProviderInterface): () => void {
  const info: EIP6963ProviderInfo = {
    uuid: crypto.randomUUID(), // Generate a new UUIDv4 for each session per EIP-6963 spec
    name: "Human Wallet",
    icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYiIHZpZXdCb3g9IjAgMCA5NiA5NiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9Ijk2IiBoZWlnaHQ9Ijk2IiByeD0iMjAiIGZpbGw9IiMwMDAwMDAiLz4KPHBhdGggZD0iTTQ4IDI0QzM0Ljc0NTIgMjQgMjQgMzQuNzQ1MiAyNCA0OEM0NCA2MS4yNTQ4IDM0Ljc0NTIgNzIgNDggNzJDNjEuMjU0OCA3MiA3MiA2MS4yNTQ4IDcyIDQ4QzcyIDM0Ljc0NTIgNjEuMjU0OCAyNCA0OCAyNFoiIGZpbGw9IiNGRkZGRkYiLz4KPC9zdmc+", // This should be the actual Human Wallet logo as base64
    rdns: "tech.human.wallet", // Reverse DNS for Human Wallet
  };

  const detail: EIP6963ProviderDetail = {
    info: Object.freeze(info),
    provider,
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
  const cleanup = announceSilkProvider(silkProvider);

  // Also make it available on window.ethereum for backward compatibility
  // Note: This should be done carefully to avoid conflicts with other wallets
  if (typeof window !== "undefined" && !window.ethereum) {
    (window as any).ethereum = silkProvider;
  }

  return cleanup;
}
