import React, { useEffect, useState, useContext } from "react";
import { startMockServiceWorker } from "../mocks/browser";
import { DatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { DID } from "dids";

interface DevModeProviderProps {
  children: React.ReactNode;
}

export const DevModeProvider: React.FC<DevModeProviderProps> = ({ children }) => {
  const [mswReady, setMswReady] = useState(false);

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEV_MODE === "true" && typeof window !== "undefined") {
      // Set up mock service worker
      startMockServiceWorker().then(() => {
        console.log("🔧 Dev Mode: MSW Started");
        setMswReady(true);
      });
    } else {
      setMswReady(true);
    }
  }, []);

  // If not in dev mode, just pass through
  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
    return <>{children}</>;
  }

  // Wait for MSW to be ready
  if (!mswReady) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-color-1">Setting up dev mode...</div>
      </div>
    );
  }

  // In dev mode, just pass through children
  // The mocking is handled by webpack aliases for wagmi and MSW for API calls
  return <>{children}</>;
};
