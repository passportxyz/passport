// --- React Methods
import React, { useCallback, useEffect } from "react";

// --- Utils & configs
import { useAppKitAccount } from "@reown/appkit/react";
import Intercom, { boot, shutdown } from "@intercom/messenger-js-sdk";

const INTERCOM_APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID || "";

export const updateIntercomUserData = ({ address }: { address?: string }) => {
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
};

// This should only be used once, at the top level of the app
export const useIntercom = () => {
  const { isConnected } = useAppKitAccount();

  const initialize = useCallback(() => {
    boot({
      app_id: INTERCOM_APP_ID,
      hide_default_launcher: false, // Keep the bubble/icon visible at all times
      // Positioning options
      alignment: "right",
      horizontal_padding: 20,
      vertical_padding: 20,
    });
  }, []);

  const onDisconnect = useCallback(() => {
    updateIntercomUserData({ address: undefined });
  }, []);

  useEffect(() => {
    if (!isConnected) {
      onDisconnect();
    }
  }, [isConnected]);

  return { initialize };
};
