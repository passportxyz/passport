/**
 * EIP-6963: Multi Injected Provider Discovery
 *
 * This file demonstrates how wallets implement EIP-6963 to make themselves
 * discoverable by dApps, and how dApps can discover and use these wallets.
 */

// ============================================================================
// Type Definitions (from EIP-6963 specification)
// ============================================================================

interface EIP6963ProviderInfo {
  uuid: string; // UUIDv4 string uniquely identifying the wallet
  name: string; // Human-readable name of the wallet
  icon: string; // Data URI of the wallet icon (base64 encoded image)
  rdns: string; // Reverse domain name of the wallet provider
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo;
  provider: EIP1193Provider; // The actual wallet provider instance
}

interface EIP1193Provider {
  request: (args: { method: string; params?: any[] }) => Promise<any>;
  on: (event: string, handler: (...args: any[]) => void) => void;
  removeListener: (event: string, handler: (...args: any[]) => void) => void;
}

// ============================================================================
// WALLET IMPLEMENTATION (How wallets announce themselves)
// ============================================================================

/**
 * Example of how a wallet announces itself via EIP-6963
 * Each wallet should implement something similar to this
 */
class WalletEIP6963Implementation {
  private provider: EIP1193Provider;
  private cleanup?: () => void;

  constructor(provider: EIP1193Provider) {
    this.provider = provider;
  }

  /**
   * Announce this wallet to dApps following EIP-6963
   */
  announce() {
    const providerInfo: EIP6963ProviderInfo = {
      uuid: "12345678-1234-1234-1234-123456789012", // Must be UUIDv4
      name: "Example Wallet",
      icon: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iOTYiIGhlaWdodD0iOTYi...", // 96x96px minimum
      rdns: "com.example.wallet", // Reverse DNS notation
    };

    const providerDetail: EIP6963ProviderDetail = {
      info: Object.freeze(providerInfo), // Freeze to prevent tampering
      provider: this.provider,
    };

    // Function to dispatch the announcement event
    const announceProvider = () => {
      const event = new CustomEvent("eip6963:announceProvider", {
        detail: Object.freeze(providerDetail),
      });
      window.dispatchEvent(event);
    };

    // Announce immediately when this method is called
    announceProvider();

    // Listen for request events from dApps and re-announce
    const handleRequest = () => announceProvider();
    window.addEventListener("eip6963:requestProvider", handleRequest);

    // Store cleanup function
    this.cleanup = () => {
      window.removeEventListener("eip6963:requestProvider", handleRequest);
    };
  }

  /**
   * Stop announcing this wallet
   */
  destroy() {
    this.cleanup?.();
  }
}

// ============================================================================
// DAPP IMPLEMENTATION (How dApps discover wallets)
// ============================================================================

/**
 * Store for managing discovered wallet providers
 */
class EIP6963ProviderStore {
  private providers: Map<string, EIP6963ProviderDetail> = new Map();
  private listeners: Set<(providers: EIP6963ProviderDetail[]) => void> = new Set();

  /**
   * Start discovering providers
   */
  startDiscovery() {
    // Listen for wallet announcements
    window.addEventListener("eip6963:announceProvider", this.handleAnnouncement);

    // Request all wallets to announce themselves
    window.dispatchEvent(new Event("eip6963:requestProvider"));
  }

  /**
   * Stop discovering providers
   */
  stopDiscovery() {
    window.removeEventListener("eip6963:announceProvider", this.handleAnnouncement);
  }

  /**
   * Handle wallet announcement
   */
  private handleAnnouncement = (event: CustomEvent<EIP6963ProviderDetail>) => {
    const { detail } = event;

    // Store provider by UUID to prevent duplicates
    this.providers.set(detail.info.uuid, detail);

    // Notify all listeners
    this.notifyListeners();
  };

  /**
   * Subscribe to provider updates
   */
  subscribe(callback: (providers: EIP6963ProviderDetail[]) => void): () => void {
    this.listeners.add(callback);

    // Immediately call with current providers
    callback(this.getProviders());

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get all discovered providers
   */
  getProviders(): EIP6963ProviderDetail[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a provider by rdns
   */
  getProviderByRDNS(rdns: string): EIP6963ProviderDetail | undefined {
    return this.getProviders().find((p) => p.info.rdns === rdns);
  }

  /**
   * Notify all listeners of provider changes
   */
  private notifyListeners() {
    const providers = this.getProviders();
    this.listeners.forEach((listener) => listener(providers));
  }
}

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example: How a dApp would discover and display wallets
 */
export function discoverWallets() {
  const store = new EIP6963ProviderStore();

  // Subscribe to provider updates
  const unsubscribe = store.subscribe((providers) => {
    console.log(
      "Discovered wallets:",
      providers.map((p) => ({
        name: p.info.name,
        rdns: p.info.rdns,
        uuid: p.info.uuid,
      }))
    );
  });

  // Start discovery
  store.startDiscovery();

  // Example: Connect to a specific wallet
  setTimeout(() => {
    const humanWallet = store.getProviderByRDNS("tech.human.wallet");
    if (humanWallet) {
      connectToWallet(humanWallet.provider);
    }
  }, 1000);

  return () => {
    unsubscribe();
    store.stopDiscovery();
  };
}

/**
 * Example: Connect to a wallet provider
 */
async function connectToWallet(provider: EIP1193Provider) {
  try {
    // Request accounts (triggers wallet connection)
    const accounts = await provider.request({
      method: "eth_requestAccounts",
    });

    console.log("Connected accounts:", accounts);

    // Get chain ID
    const chainId = await provider.request({
      method: "eth_chainId",
    });

    console.log("Connected to chain:", parseInt(chainId, 16));
  } catch (error) {
    console.error("Failed to connect:", error);
  }
}

// ============================================================================
// COMMON RDNS VALUES (for reference)
// ============================================================================

export const COMMON_WALLET_RDNS = {
  METAMASK: "io.metamask",
  COINBASE: "com.coinbase.wallet",
  RAINBOW: "me.rainbow",
  TRUST: "com.trustwallet.app",
  ARGENT: "xyz.argent",
  SAFE: "io.safe",
  ZERION: "io.zerion.wallet",
  BRAVE: "com.brave.wallet",
  OPERA: "com.opera",
  HUMAN: "tech.human.wallet", // Human Wallet (Silk)
} as const;

// ============================================================================
// SECURITY CONSIDERATIONS
// ============================================================================

/**
 * Example: Sanitize wallet icon before displaying
 * SVG images can contain JavaScript, so they should be sanitized
 */
export function sanitizeWalletIcon(icon: string): string {
  // Basic check for data URI
  if (!icon.startsWith("data:image/")) {
    console.warn("Invalid icon format");
    return "";
  }

  // For SVG, additional sanitization would be needed
  if (icon.includes("data:image/svg")) {
    // In production, use a proper SVG sanitizer library
    console.warn("SVG icons should be sanitized before display");
  }

  return icon;
}

/**
 * Example: Validate provider info
 */
export function validateProviderInfo(info: EIP6963ProviderInfo): boolean {
  // Check UUID format (basic check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(info.uuid)) {
    console.error("Invalid UUID format");
    return false;
  }

  // Check rdns format
  if (!info.rdns || !info.rdns.includes(".")) {
    console.error("Invalid RDNS format");
    return false;
  }

  // Check required fields
  if (!info.name || !info.icon) {
    console.error("Missing required fields");
    return false;
  }

  return true;
}
