// --- React Methods
import React, { useCallback, useEffect, useState } from "react";

// --- Utils & configs
import { useAppKitAccount } from "@reown/appkit/react";
import Intercom, { boot, shutdown } from "@intercom/messenger-js-sdk";

const INTERCOM_APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID || "";

export const updateIntercomUserData = ({ address }: { address?: string }) => {
  if (!INTERCOM_APP_ID) {
    return;
  }

  try {
    shutdown();

    boot({
      app_id: INTERCOM_APP_ID,
      name: address,
      hide_default_launcher: false, // Keep the bubble/icon visible at all times
      // Positioning options
      alignment: "right",
      horizontal_padding: 20,
      vertical_padding: 20,
    });
  } catch (error) {
    console.error("Intercom error:", error);
  }
};

// This should only be used once, at the top level of the app
export const useIntercom = () => {
  const { isConnected } = useAppKitAccount();
  const [hasInitialized, setHasInitialized] = useState(false);

  const initialize = useCallback(() => {
    if (!INTERCOM_APP_ID) {
      return;
    }

    try {
      Intercom({
        app_id: INTERCOM_APP_ID,
        hide_default_launcher: false, // Keep the bubble/icon visible at all times
        // Positioning options
        alignment: "right",
        horizontal_padding: 20,
        vertical_padding: 20,
      });

      setHasInitialized(true);
    } catch (error) {
      console.error("Intercom initialization error:", error);
    }
  }, []);

  const onDisconnect = useCallback(() => {
    updateIntercomUserData({ address: undefined });
  }, [isConnected]);

  useEffect(() => {
    // Only call onDisconnect if we have initialized and the wallet is disconnected
    // This prevents calling onDisconnect on initial load when isConnected is false
    if (hasInitialized && !isConnected) {
      onDisconnect();
    }
  }, [isConnected, onDisconnect, hasInitialized]);

  return { initialize };
};
