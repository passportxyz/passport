// --- React Methods
import React, { useCallback, useEffect } from "react";

// --- Utils & configs
import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import Intercom, { boot, shutdown } from "@intercom/messenger-js-sdk";
import { DID } from "dids";

const INTERCOM_APP_ID = process.env.NEXT_PUBLIC_INTERCOM_APP_ID || "";

export const updateIntercomUserData = ({ did, hash }: { did?: DID; hash?: string }) => {
  shutdown();
  boot({
    app_id: INTERCOM_APP_ID,
    user_id: did?.id,
    user_hash: hash,
  });
};

// This should only be used once, at the top level of the app
export const useIntercom = () => {
  const { isConnected } = useWeb3ModalAccount();

  const initialize = useCallback(() => {
    Intercom({
      app_id: INTERCOM_APP_ID,
    });
  }, []);

  const onDisconnect = useCallback(() => {
    updateIntercomUserData({ did: undefined, hash: undefined });
  }, []);

  useEffect(() => {
    if (!isConnected) {
      onDisconnect();
    }
  }, [isConnected]);

  return { initialize };
};
