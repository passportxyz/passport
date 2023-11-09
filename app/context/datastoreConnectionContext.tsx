import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { useViewerConnection } from "@self.id/framework";
import { datadogRum } from "@datadog/browser-rum";
import { useWalletStore } from "./walletStore";
import { DoneToastContent } from "../components/DoneToastContent";
import { EthereumAuthProvider } from "@self.id/web";
import { EthereumWebAuth } from "@didtools/pkh-ethereum";
import { DIDSession } from "did-session";
import { DID } from "dids";
import axios from "axios";
import { Cacao } from "@didtools/cacao";
import { AccountId } from "caip";

import { CERAMIC_CACHE_ENDPOINT } from "../config/stamp_config";
import { useToast } from "@chakra-ui/react";
import { Eip1193Provider } from "ethers";

export type DbAuthTokenStatus = "idle" | "failed" | "connected" | "connecting";

export type DatastoreConnectionContextState = {
  dbAccessTokenStatus: DbAuthTokenStatus;
  dbAccessToken?: string;
  disconnect: () => Promise<void>;
  connect: (address: string, provider: Eip1193Provider) => Promise<void>;
};

export const DatastoreConnectionContext = createContext<DatastoreConnectionContextState>({
  dbAccessTokenStatus: "idle",
  disconnect: async () => {},
  connect: async () => {},
});

// In the app, the context hook should be used. This is only exported for testing
export const useDatastoreConnection = () => {
  const toast = useToast();
  const [ceramicConnection, connectCeramic, disconnectCeramic] = useViewerConnection();

  const disconnectWallet = useWalletStore((state) => state.disconnect);
  const chain = useWalletStore((state) => state.chain);

  const [dbAccessTokenStatus, setDbAccessTokenStatus] = useState<DbAuthTokenStatus>("idle");
  const [dbAccessToken, setDbAccessToken] = useState<string | undefined>();

  useEffect(() => {
    // Clear status when wallet disconnected
    if (!chain && dbAccessTokenStatus === "connected") {
      setDbAccessTokenStatus("idle");
      setDbAccessToken(undefined);
    }
  }, [chain]);

  useEffect((): void => {
    switch (ceramicConnection.status) {
      case "failed": {
        // user refused to connect to ceramic -- disconnect them
        disconnectWallet();
        console.log("failed to connect self id :(", ceramicConnection.error);
        break;
      }
      default:
        break;
    }
  }, [ceramicConnection.status]);

  const handleConnectionError = async (sessionKey: string, dbCacheTokenKey: string) => {
    await disconnectWallet();
    window.localStorage.removeItem(sessionKey);
    window.localStorage.removeItem(dbCacheTokenKey);
  };

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

    // sign the payload as dag-jose
    const { jws, cacaoBlock } = await did.createDagJWS(payloadToSign);

    // Get the JWS & serialize it (this is what we would send to the BE)
    const { link, payload, signatures } = jws;

    if (cacaoBlock !== undefined) {
      const cacao = await Cacao.fromBlockBytes(cacaoBlock);
      const issuer = cacao.p.iss;

      const payloadForVerifier = {
        signatures: signatures,
        payload: payload,
        cid: Array.from(link ? link.bytes : []),
        cacao: Array.from(cacaoBlock ? cacaoBlock : []),
        issuer,
        nonce: nonce,
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
    } else {
      const msg = `Failed to create DagJWS for did: ${did.parent}`;
      datadogRum.addError(msg);
      throw msg;
    }
  };

  const loadDbAccessToken = async (address: string, did: DID) => {
    const dbCacheTokenKey = `dbcache-token-${address}`;
    // TODO: if we load the token from the localstorage we should validate it
    // let dbAccessToken = window.localStorage.getItem(dbCacheTokenKey);
    let dbAccessToken = null;

    // Here we try to get an access token for the Passport database
    // We should get a new access token:
    // 1. if the user has nonde
    // 2. in case a new session has been created (access tokens should expire similar to sessions)
    // TODO: verifying the validity of the access token would also make sense => check the expiration data in the token
    if (!dbAccessToken) {
      setDbAccessTokenStatus("connecting");

      try {
        dbAccessToken = await getPassportDatabaseAccessToken(did);
        // Store the session in localstorage
        // @ts-ignore
        window.localStorage.setItem(dbCacheTokenKey, dbAccessToken);
        setDbAccessToken(dbAccessToken || undefined);
        setDbAccessTokenStatus(dbAccessToken ? "connected" : "failed");
      } catch (error) {
        setDbAccessTokenStatus("failed");

        // Should we logout the user here? They will be unable to write to passport
        const msg = `Error getting access token for did: ${did}`;
        datadogRum.addError(msg);
      }
    } else {
      setDbAccessToken(dbAccessToken || undefined);
      setDbAccessTokenStatus(dbAccessToken ? "connected" : "failed");
    }
  };

  const connect = useCallback(
    async (address: string, provider: Eip1193Provider) => {
      if (address) {
        let sessionKey = "";
        let dbCacheTokenKey = "";

        try {
          const ethAuthProvider = new EthereumAuthProvider(provider, address.toLowerCase());
          // Sessions will be serialized and stored in localhost
          // The sessions are bound to an ETH address, this is why we use the address in the session key
          sessionKey = `didsession-${address}`;
          dbCacheTokenKey = `dbcache-token-${address}`;
          const sessionStr = window.localStorage.getItem(sessionKey);

          // @ts-ignore
          // When sessionStr is null, this will create a new selfId. We want to avoid this, becasue we want to make sure
          // that chainId 1 is in the did
          let selfId = !!sessionStr ? await connectCeramic(ethAuthProvider, sessionStr) : null;
          if (
            // @ts-ignore
            !selfId ||
            // @ts-ignore
            !selfId?.client?.session
          ) {
            // If the session loaded is not valid, or if it is expired or close to expire, we create
            // a new session
            // Also we enforce the "1" chainId, as we always want to use mainnet dids, in order to avoid confusion
            // as to where a passport / stamp has been stored
            const authMethod = await EthereumWebAuth.getAuthMethod(
              provider,
              new AccountId({
                chainId: "eip155:1",
                address,
              })
            );

            const session = await DIDSession.authorize(authMethod, {
              resources: ["ceramic://*"],
            });
            const newSessionStr = session.serialize();

            // @ts-ignore
            selfId = await connectCeramic(ethAuthProvider, newSessionStr);

            // Store the session in localstorage
            // @ts-ignore
            window.localStorage.setItem(sessionKey, selfId?.client?.session?.serialize());
          } else if (
            // @ts-ignore
            selfId?.client?.session?.isExpired ||
            // @ts-ignore
            selfId?.client?.session?.expireInSecs < 3600
          ) {
            await handleConnectionError(sessionKey, dbCacheTokenKey);
          }
          if (selfId) {
            await loadDbAccessToken(address, selfId.did);
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
    [connectCeramic, toast]
  );

  const disconnect = async () => {
    await disconnectWallet();
    disconnectCeramic();
  };

  return {
    connect,
    disconnect,
    dbAccessToken,
    dbAccessTokenStatus,
  };
};

export const DatastoreConnectionContextProvider = ({ children }: { children: any }) => {
  const { dbAccessToken, dbAccessTokenStatus, disconnect, connect } = useDatastoreConnection();

  const providerProps = useMemo(
    () => ({
      connect,
      disconnect,
      dbAccessToken,
      dbAccessTokenStatus,
    }),
    [dbAccessToken, dbAccessTokenStatus]
  );

  return <DatastoreConnectionContext.Provider value={providerProps}>{children}</DatastoreConnectionContext.Provider>;
};

export const useDatastoreConnectionContext = () => useContext(DatastoreConnectionContext);
