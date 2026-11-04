import { WaaPWalletConnect } from "@human.tech/waap-sdk";
import { disconnect, getAccount, getConnections, switchAccount } from "wagmi/actions";
import { wagmiConfig } from "./web3";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID as string;

// Thrown when the user closes the connect window or rejects in their wallet.
export class LinkCancelledError extends Error {
  constructor() {
    super("Wallet linking was cancelled");
    this.name = "LinkCancelledError";
  }
}

// The SDK's linkAddress signs through its own WalletConnect (AppKit) instance and requires the
// address up front, so connect the wallet being linked there first and read its address.
// Closing the connect window rejects instead of waiting for the SDK's 60 s timeout.
export async function connectWalletToLink(): Promise<string> {
  if (projectId) WaaPWalletConnect.setProjectId(projectId);
  const appKit = await WaaPWalletConnect.getInstance();
  if (!appKit) throw new Error("WalletConnect is unavailable");

  if (!WaaPWalletConnect.isConnected()) {
    await appKit.open({ view: "Connect" });
    await new Promise<void>((resolve, reject) => {
      const unsubscribers: Array<() => void> = [];
      const done = (error?: Error) => {
        unsubscribers.forEach((unsubscribe) => unsubscribe());
        if (error) reject(error);
        else resolve();
      };
      unsubscribers.push(
        appKit.subscribeAccount((account: { isConnected?: boolean; address?: string }) => {
          if (account?.isConnected) done();
        }),
        appKit.subscribeState((state: { open?: boolean }) => {
          if (!state?.open && !WaaPWalletConnect.isConnected()) done(new LinkCancelledError());
        })
      );
    });
  }

  const accounts: string[] = (await WaaPWalletConnect.getWalletProvider()?.request({ method: "eth_accounts" })) ?? [];
  if (!accounts[0]) throw new Error("No account returned by the connected wallet");
  return accounts[0];
}

// End the WalletConnect session so the next link starts from a fresh wallet choice.
export async function disconnectWalletToLink(): Promise<void> {
  const appKit = await WaaPWalletConnect.getInstance();
  // Not fatal: the next link opens the connect window again either way.
  await appKit?.disconnect().catch((error: unknown) => console.warn("Could not end the WalletConnect session", error));
}

// While a wallet is being linked, keep `connectorUid` (the user's own login) as wagmi's active
// connection. Without this the wallet being linked becomes active as soon as it connects, and the
// header shows its address until restoreActiveConnection runs after the link. `current` is set back
// in the same tick as the change (switchAccount awaits storage first, so React could render the
// other address in between). Returns the function that stops holding.
export function holdActiveConnection(connectorUid: string): () => void {
  return wagmiConfig.subscribe(
    (state) => state.current,
    (current) => {
      if (current === connectorUid || !wagmiConfig.state.connections.has(connectorUid)) return;
      wagmiConfig.setState((state) => ({ ...state, current: connectorUid }));
    }
  );
}

// Connecting the wallet to link makes wagmi's injected connector auto-connect and become the active
// connection (wagmi core: injected onAccountsChanged → onConnect → config `current`). Drop every
// other connection and make `connectorUid` (the user's own login) active again.
export async function restoreActiveConnection(connectorUid: string): Promise<void> {
  for (const { connector } of getConnections(wagmiConfig)) {
    if (connector.uid === connectorUid) continue;
    await disconnect(wagmiConfig, { connector }).catch((error: unknown) =>
      console.warn("Could not drop an extra wallet connection after linking", connector.id, error)
    );
  }
  const own = getConnections(wagmiConfig).find(({ connector }) => connector.uid === connectorUid);
  if (own && getAccount(wagmiConfig).connector?.uid !== connectorUid) {
    await switchAccount(wagmiConfig, { connector: own.connector });
  }
}

// The auth server's cap on active linked wallets (MAX_LINKED_WALLETS in its linked-wallets repo).
// A wallet in cooldown after an unlink doesn't count, and getLinkedAddresses leaves those out too
// (the auth server's `addresses` field is active wallets only).
export const MAX_LINKED_WALLETS = 5;
export const LINK_LIMIT_MESSAGE = `You can have up to ${MAX_LINKED_WALLETS} linked wallets. Unlink one to add another.`;

export type LinkFailure = "cancelled" | "conflict" | "limit" | "error";

// Map a failed link to the WalletLinking screen it should show. The auth server's 409 message is
// "Address is already linked to another account", its 422 "This account already has the maximum
// of 5 linked wallets"; wallet rejections carry code 4001 or "rejected".
export function classifyLinkError(error: unknown): LinkFailure {
  if (error instanceof LinkCancelledError) return "cancelled";
  // The SDK rejects with either an Error or a plain `{ error: "..." }` object.
  // ...or, as for the 422, a bare string.
  if (typeof error === "string") error = { message: error };
  const { code, message, error: detail } = (error ?? {}) as { code?: number; message?: string; error?: unknown };
  const text = `${message ?? ""} ${typeof detail === "string" ? detail : ""}`;
  if (code === 4001 || /rejected|denied/i.test(text)) return "cancelled";
  if (/already linked to another account/i.test(text)) return "conflict";
  if (/maximum of \d+ linked wallets/i.test(text)) return "limit";
  return "error";
}
