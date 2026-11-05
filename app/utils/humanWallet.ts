// Utility function to handle Human Wallet logout.
// Covers both the current WaaP provider (window.waap) and the legacy Silk provider (window.silk).
// The SDK points both at the same object, and every logout is a round trip to the WaaP iframe, so
// each object is logged out once, and callers that overlap (Disconnect, the WaaP connector's
// disconnect, the session-cleared effect) share one logout instead of starting their own.
type LogoutProvider = { logout?: () => Promise<unknown> | unknown };

let inFlight: Promise<void> | null = null;

// `fallback` is the WaaP connector's own provider, used when the SDK hasn't exposed one on window.
export const logoutHumanWallet = (fallback?: LogoutProvider): Promise<void> => {
  if (typeof window === "undefined") return Promise.resolve();
  if (inFlight) return inFlight;

  const exposed = [(window as any).waap, (window as any).silk] as (LogoutProvider | undefined)[];
  const providers = [...new Set(exposed)].filter((p): p is LogoutProvider => typeof p?.logout === "function");
  if (!providers.length && typeof fallback?.logout === "function") providers.push(fallback);
  if (!providers.length) return Promise.resolve();

  inFlight = (async () => {
    for (const provider of providers) {
      try {
        console.log("Logging out from Human Wallet...");
        await provider.logout!();
      } catch (error) {
        console.error("Error logging out from Human Wallet:", error);
      }
    }
  })().finally(() => {
    inFlight = null;
  });
  return inFlight;
};
