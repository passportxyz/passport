// Global error interceptor to log wallet connection errors before they get sent to analytics
// This helps debug issues when analytics endpoints are blocked by CORS

export function setupErrorInterceptor() {
  if (typeof window === "undefined") return;

  // Store original postMessage
  const originalPostMessage = window.postMessage;

  // Override postMessage to intercept error tracking
  window.postMessage = function (message: any, targetOrigin: string, transfer?: Transferable[]) {
    // Check if this is an error tracking message
    if (message && typeof message === "object") {
      if (message.type === "track" && message.event === "CONNECT_ERROR") {
        console.error("=== Human Wallet Connection Error ===");
        console.error("Error details:", message.properties);
        console.error("This error was intercepted before being sent to analytics");
        console.error("=====================================");
      }
    }

    // Call original postMessage
    try {
      return originalPostMessage.apply(window, [message, targetOrigin, transfer]);
    } catch (e) {
      // Silently ignore CORS errors for analytics endpoints
      if (!e.message?.includes("cross-origin")) {
        throw e;
      }
    }
  };

  // Also add unhandled promise rejection handler
  window.addEventListener("unhandledrejection", (event) => {
    if (event.reason?.message?.includes("Address") && event.reason?.message?.includes("invalid")) {
      console.error("=== Unhandled Address Validation Error ===");
      console.error("Error:", event.reason);
      console.error("This typically means Human Wallet returned an empty address");
      console.error("Check the provider initialization and eth_accounts response");
      console.error("==========================================");
    }
  });
}

// Call this early in the app initialization
setupErrorInterceptor();
