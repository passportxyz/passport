import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// This configures a Service Worker with the given request handlers
export const worker = setupWorker(...handlers);

// Start worker with specific options
export async function startMockServiceWorker() {
  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
    return;
  }

  return worker.start({
    onUnhandledRequest: "bypass", // Let unhandled requests pass through
    serviceWorker: {
      url: "/mockServiceWorker.js",
    },
  });
}
