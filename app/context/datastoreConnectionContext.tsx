import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { datadogRum } from "@datadog/browser-rum";
import { useWalletStore } from "./walletStore";
import { DoneToastContent } from "../components/DoneToastContent";
import { EthereumAuthProvider } from "@self.id/web";
import { EthereumWebAuth, getAccountId } from "@didtools/pkh-ethereum";
import { ComposeClient } from "@composedb/client";
import { DIDSession } from "did-session";
import { DID } from "dids";
import axios from "axios";
import { AccountId } from "caip";
import { MAX_VALID_DID_SESSION_AGE } from "@gitcoin/passport-identity";

import { CERAMIC_CACHE_ENDPOINT } from "../config/stamp_config";
import { useToast } from "@chakra-ui/react";
import { Eip1193Provider } from "ethers";
import { createSignedPayload } from "../utils/helpers";
import { ComposeDatabase } from "@gitcoin/passport-database-client";
import { datadogLogs } from "@datadog/browser-logs";

const BUFFER_TIME_BEFORE_EXPIRATION = 60 * 60 * 1000;

export type DbAuthTokenStatus = "idle" | "failed" | "connected" | "connecting";

export type DatastoreConnectionContextState = {
  dbAccessTokenStatus: DbAuthTokenStatus;
  dbAccessToken?: string;
  did?: DID;
  disconnect: (address: string) => Promise<void>;
  connect: (address: string, provider: Eip1193Provider) => Promise<void>;
  checkSessionIsValid: () => boolean;
};

export const DatastoreConnectionContext = createContext<DatastoreConnectionContextState>({
  dbAccessTokenStatus: "idle",
  disconnect: async (address: string) => {},
  connect: async () => {},
  checkSessionIsValid: () => false,
});

// In the app, the context hook should be used. This is only exported for testing
export const useDatastoreConnection = () => {
  const toast = useToast();

  const disconnectWallet = useWalletStore((state) => state.disconnect);
  const chain = useWalletStore((state) => state.chain);

  const [dbAccessTokenStatus, setDbAccessTokenStatus] = useState<DbAuthTokenStatus>("idle");
  const [dbAccessToken, setDbAccessToken] = useState<string | undefined>();

  const [did, setDid] = useState<DID>();
  const [checkSessionIsValid, setCheckSessionIsValid] = useState<() => boolean>(() => false);

  useEffect(() => {
    // Clear status when wallet disconnected
    if (!chain && dbAccessTokenStatus === "connected") {
      setDbAccessTokenStatus("idle");
      setDbAccessToken(undefined);
    }
  }, [chain, dbAccessTokenStatus]);

  const handleConnectionError = useCallback(
    async (sessionKey: string, dbCacheTokenKey: string) => {
      await disconnectWallet();
      window.localStorage.removeItem(sessionKey);
      window.localStorage.removeItem(dbCacheTokenKey);
    },
    [disconnectWallet]
  );

  const getPassportDatabaseAccessToken = async (did: DID): Promise<string> => {
    let nonce = null;
    try {
      // Get nonce from server
      const nonceResponse = await axios.get(`${process.env.NEXT_PUBLIC_SCORER_ENDPOINT}/account/nonce`);
      nonce = nonceResponse.data.nonce;
    } catch (error) {
      const msg = `Failed to get nonce from server for user with did: ${did.parent}`;
      datadogRum.addError(msg);
      throw msg;
    }

    const payloadToSign = { nonce };
    const payloadForVerifier = {
      ...(await createSignedPayload(did, payloadToSign)),
      nonce,
    };

    try {
      const authResponse = await axios.post(`${CERAMIC_CACHE_ENDPOINT}/authenticate`, payloadForVerifier);
      const accessToken = authResponse.data?.access as string;
      return accessToken;
    } catch (error) {
      const msg = `Failed to authenticate user with did: ${did.parent}`;
      datadogRum.addError(msg);
      throw msg;
    }
  };

  const loadDbAccessToken = useCallback(async (address: string, did: DID) => {
    const dbCacheTokenKey = `dbcache-token-${address}`;
    // TODO: if we load the token from the localstorage we should validate it
    // let dbAccessToken = window.localStorage.getItem(dbCacheTokenKey);
    let dbAccessToken = null;

    // Here we try to get an access token for the Passport database
    // We should get a new access token:
    // 1. if the user has nonde
    // 2. in case a new session has been created (access tokens should expire similar to sessions)
    // TODO: verifying the validity of the access token would also make sense => check the expiration data in the token

    try {
      dbAccessToken = await getPassportDatabaseAccessToken(did);
      // Store the session in localstorage
      // @ts-ignore
      window.localStorage.setItem(dbCacheTokenKey, dbAccessToken);
      setDbAccessToken(dbAccessToken || undefined);
      const status = dbAccessToken ? "connected" : "failed";
      setDbAccessTokenStatus("connected");
    } catch (error) {
      setDbAccessTokenStatus("failed");

      // Should we logout the user here? They will be unable to write to passport
      const msg = `Error getting access token for did: ${did}`;
      datadogRum.addError(msg);
    }
  }, []);

  const connect = useCallback(
    async (address: string, provider: Eip1193Provider) => {
      if (address) {
        let sessionKey = "";
        let dbCacheTokenKey = "";

        try {
          const accountId = new AccountId({
            chainId: "eip155:1",
            address,
          });
          const authMethod = await EthereumWebAuth.getAuthMethod(provider, accountId);
          // Sessions will be serialized and stored in localhost
          // The sessions are bound to an ETH address, this is why we use the address in the session key
          sessionKey = `didsession-${address}`;
          dbCacheTokenKey = `dbcache-token-${address}`;
          // const sessionStr = window.localStorage.getItem(sessionKey);
          // let session: DIDSession | undefined = undefined;
          // try {
          //   if (sessionStr) {
          //     session = await DIDSession.fromSession(sessionStr);
          //   }
          // } catch (error) {
          //   console.log("Error parsing session from localStorage:", error);
          //   window.localStorage.removeItem(sessionKey);
          // }

          // if (
          //   true
          //   //  || // Hotfix: Hardcoding this here, as we always want a session created by DIDSession.get ... (at least for now)
          //   // !session ||
          //   // session.isExpired ||
          //   // session.expireInSecs < 3600 ||
          //   // !session.hasSession ||
          //   // Date.now() - new Date(session?.cacao?.p?.iat).getTime() >
          //   //   MAX_VALID_DID_SESSION_AGE - BUFFER_TIME_BEFORE_EXPIRATION
          // ) {
          //   // session = await DIDSession.authorize(authMethod, { resources: ["ceramic://*"] });
          //   // Store the session in localstorage
          //   // window.localStorage.setItem(sessionKey, session.serialize());
          // }

          // Extensions which inject the Buffer library break the
          // did-session library, so we need to remove it
          if (globalThis.Buffer) {
            datadogLogs.logger.warn("Buffer library is injected, setting to undefined", {
              buffer: `${globalThis.Buffer}`,
            });
            globalThis.Buffer = undefined as any;
            console.log(
              "Warning: Buffer library is injected! This will be overwritten in order to avoid conflicts with did-session."
            );
          } else {
            console.log("Buffer library is not injected (this is good)");
          }
          let session: DIDSession = await DIDSession.get(accountId, authMethod, { resources: ["ceramic://*"] });

          if (session) {
            await loadDbAccessToken(address, session.did);
            setDid(session.did);

            // session.isExpired looks like a static variable so this looks like a bug,
            // but isExpired is a getter, so it's actually checking the current status
            // whenever checkSessionIsValid is called
            setCheckSessionIsValid(() => () => !session.isExpired);
          }
        } catch (error) {
          await handleConnectionError(sessionKey, dbCacheTokenKey);
          toast({
            duration: 6000,
            isClosable: true,
            render: (result: any) => (
              <DoneToastContent
                title={"Connection Error"}
                body={(error as Error).message}
                icon="../assets/verification-failed-bright.svg"
                result={result}
              />
            ),
          });
          datadogRum.addError(error);
        }
      }
    },
    [handleConnectionError, loadDbAccessToken, toast]
  );

  const disconnect = async (address: string) => {
    await disconnectWallet();
    localStorage.removeItem(`didsession-${address}`);
  };

  return {
    did,
    connect,
    disconnect,
    dbAccessToken,
    dbAccessTokenStatus,
    checkSessionIsValid,
  };
};

export const DatastoreConnectionContextProvider = ({ children }: { children: any }) => {
  const { dbAccessToken, dbAccessTokenStatus, disconnect, connect, did, checkSessionIsValid } =
    useDatastoreConnection();

  const providerProps = useMemo(
    () => ({
      did,
      connect,
      disconnect,
      dbAccessToken,
      dbAccessTokenStatus,
      checkSessionIsValid,
    }),
    [dbAccessToken, dbAccessTokenStatus, did, connect, disconnect, checkSessionIsValid]
  );

  return <DatastoreConnectionContext.Provider value={providerProps}>{children}</DatastoreConnectionContext.Provider>;
};

export const useDatastoreConnectionContext = () => useContext(DatastoreConnectionContext);
