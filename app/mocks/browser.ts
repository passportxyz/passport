import { handlers } from "./handlers";

// Start worker with specific options
export async function startMockServiceWorker() {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
    return;
  }

  // Only setup worker in browser environment
  if (typeof window === "undefined") {
    console.log("🔧 Dev Mode: Skipping MSW setup in server environment");
    return;
  }

  // Dynamically import and setup worker only in browser
  const { setupWorker } = await import("msw/browser");
  const worker = setupWorker(...handlers);

  return worker.start({
    onUnhandledRequest: "bypass", // Let unhandled requests pass through
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
  });
}
