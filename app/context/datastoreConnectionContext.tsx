import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { datadogRum } from "@datadog/browser-rum";
import { EthereumWebAuth } from "@didtools/pkh-ethereum";
import { Buffer } from "buffer";

import { DIDSession } from "did-session";
import { DID } from "dids";
import axios from "axios";
import { AccountId } from "caip";

import { CERAMIC_CACHE_ENDPOINT } from "../config/stamp_config";
import { Eip1193Provider } from "ethers";
import { createSignedPayload } from "../utils/helpers";
import { updateIntercomUserData } from "../hooks/useIntercom";
import { useAppKitAccount, useDisconnect } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import { PublicClient } from "viem";

export type DbAuthTokenStatus = "idle" | "failed" | "connected" | "connecting";

export type DatastoreConnectionContextState = {
  dbAccessTokenStatus: DbAuthTokenStatus;
  dbAccessToken?: string;
  did?: DID;
  disconnect: (address: string) => Promise<void>;
  connect: (address: string, publicClient: PublicClient) => Promise<void>;
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
  const { disconnect: disconnectWallet } = useDisconnect();
  const { chain } = useAccount();
  const { isConnected, address: web3ModalAddress } = useAppKitAccount();

  const [dbAccessTokenStatus, setDbAccessTokenStatus] = useState<DbAuthTokenStatus>("idle");
  const [dbAccessToken, setDbAccessToken] = useState<string | undefined>();
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>();

  const [did, setDid] = useState<DID>();
  const [checkSessionIsValid, setCheckSessionIsValid] = useState<() => boolean>(() => false);

  useEffect(() => {
    // Clear status when wallet disconnected
    if (
      (!chain || !isConnected || (connectedAddress && web3ModalAddress !== connectedAddress)) &&
      dbAccessTokenStatus === "connected"
    ) {
      console.log("Clearing db access token", chain, isConnected, connectedAddress, web3ModalAddress);
      setConnectedAddress(undefined);
      setDbAccessTokenStatus("idle");
      setDbAccessToken(undefined);
    }
  }, [chain, dbAccessTokenStatus, isConnected, web3ModalAddress, connectedAddress]);

  const getPassportDatabaseAccessToken = async (did: DID, address: string): Promise<string> => {
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
      updateIntercomUserData({ address });
      setConnectedAddress(address);
      return accessToken;
    } catch (error) {
      const msg = `Failed to authenticate user with did: ${did.parent}`;
      datadogRum.addError(msg);
      throw msg;
    }
  };

  const loadDbAccessToken = useCallback(async (address: string, did: DID) => {
    const dbCacheTokenKey = `dbcache-token-${address}`;
    let dbAccessToken = null;

    // Here we try to get an access token for the Passport database
    // We should get a new access token:
    // 1. if the user has nonde
    // 2. in case a new session has been created (access tokens should expire similar to sessions)
    // TODO: verifying the validity of the access token would also make sense => check the expiration data in the token

    try {
      dbAccessToken = await getPassportDatabaseAccessToken(did, address);
      // Store the session in localstorage
      // @ts-ignore
      window.localStorage.setItem(dbCacheTokenKey, dbAccessToken);
      setDbAccessToken(dbAccessToken || undefined);
      setDbAccessTokenStatus("connected");
    } catch (error) {
      setDbAccessTokenStatus("failed");

      const msg = `Error getting access token for did: ${did}`;
      console.error("Error getting access token for did:", error);
      datadogRum.addError(msg);

      throw error;
    }
  }, []);

  const connect = useCallback(
    async (address: string, publicClient: PublicClient) => {
      if (address) {
        try {
          // This is to fix issues with extensions that inject old versions of Buffer
          globalThis.Buffer = Buffer;

          const accountId = new AccountId({
            // We always use chain id 1 for now for all sessions, to avoid users
            // switching networks and not see their stamps any more
            chainId: "eip155:1",
            address,
          });
          const authMethod = await EthereumWebAuth.getAuthMethod(publicClient, accountId);

          let session: DIDSession = await DIDSession.get(accountId, authMethod, { resources: ["ceramic://*"] });

          if (session) {
            await loadDbAccessToken(address, session.did);
            setDid(session.did);

            setCheckSessionIsValid(() => () => !session.isExpired);
          }
        } catch (error) {
          await disconnectWallet();
          throw error;
        }
      }
    },
    [disconnectWallet, loadDbAccessToken]
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
