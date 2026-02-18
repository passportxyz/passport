import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { datadogRum } from "@datadog/browser-rum";
import { SiweMessage } from "siwe";
import axios from "axios";

import { CERAMIC_CACHE_ENDPOINT } from "../config/stamp_config";
import { updateIntercomUserData } from "../hooks/useIntercom";
import { useCustomDisconnect } from "../hooks/useCustomDisconnect";
import { useAccount } from "wagmi";
import { WalletClient } from "viem";
import { logoutHumanWallet } from "../utils/humanWallet";

const SIWE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes

export type DbAuthTokenStatus = "idle" | "failed" | "connected" | "connecting";

export type DatastoreConnectionContextState = {
  dbAccessTokenStatus: DbAuthTokenStatus;
  dbAccessToken?: string;
  userAddress?: string;
  disconnect: (address: string) => Promise<void>;
  connect: (address: string, walletClient: WalletClient) => Promise<void>;
  checkSessionIsValid: () => boolean;
};

export const DatastoreConnectionContext = createContext<DatastoreConnectionContextState>({
  dbAccessTokenStatus: "idle",
  disconnect: async (_address: string) => {},
  connect: async () => {},
  checkSessionIsValid: () => false,
});

// Helper function to get JWT algorithm from header
const getJwtAlgorithm = (token: string): string | undefined => {
  try {
    const header = JSON.parse(atob(token.split(".")[0]));
    return header.alg;
  } catch {
    return undefined;
  }
};

// Helper function to parse JWT expiry
const parseJwtExpiry = (token: string): Date | undefined => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp ? new Date(payload.exp * 1000) : undefined;
  } catch {
    return undefined;
  }
};

// Helper function to check if token is valid
// Rejects old HS256 tokens from pre-SIWE migration - only RS256 tokens are valid
const isTokenValid = (token: string): boolean => {
  // Check algorithm - only accept RS256 (new SIWE tokens)
  const alg = getJwtAlgorithm(token);
  if (alg !== "RS256") {
    return false;
  }

  // Check expiry
  const expiry = parseJwtExpiry(token);
  if (!expiry) return false;
  return expiry > new Date();
};

// In the app, the context hook should be used. This is only exported for testing
export const useDatastoreConnection = () => {
  const { disconnect: disconnectWallet } = useCustomDisconnect();
  const { isConnected, address: web3ModalAddress, chain, chainId } = useAccount();

  const [dbAccessTokenStatus, setDbAccessTokenStatus] = useState<DbAuthTokenStatus>("idle");
  const [dbAccessToken, setDbAccessToken] = useState<string | undefined>();
  const [connectedAddress, setConnectedAddress] = useState<string | undefined>();
  const [userAddress, setUserAddress] = useState<string | undefined>();

  const [checkSessionIsValid, setCheckSessionIsValid] = useState<() => boolean>(() => false);

  useEffect(() => {
    // Clear status when wallet disconnected
    if (
      (!chain || !isConnected || (connectedAddress && web3ModalAddress !== connectedAddress)) &&
      dbAccessTokenStatus === "connected"
    ) {
      console.log("Clearing db access token", chain, isConnected, connectedAddress, web3ModalAddress);

      // Handle Human Wallet logout when disconnected from any source
      logoutHumanWallet().catch(console.error);

      setConnectedAddress(undefined);
      setDbAccessTokenStatus("idle");
      setDbAccessToken(undefined);
      setUserAddress(undefined);
    }
  }, [chain, dbAccessTokenStatus, isConnected, web3ModalAddress, connectedAddress]);

  const getPassportDatabaseAccessToken = async (address: string, walletClient: WalletClient): Promise<string> => {
    let nonce = null;
    try {
      // Get nonce from server
      const nonceResponse = await axios.get(`${process.env.NEXT_PUBLIC_SCORER_ENDPOINT}/account/nonce`);
      nonce = nonceResponse.data.nonce;
    } catch (error) {
      const msg = `Failed to get nonce from server for user with address: ${address}. Error: ${error}`;
      datadogRum.addError(msg);
      throw new Error(msg);
    }

    try {
      // Always use mainnet (chainId: 1) for SIWE messages
      // Smart wallet factories are deployed on mainnet, so ERC-6492 verification works there
      const connectedChainId = 1;

      // Create SIWE message
      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to Human Passport",
        uri: window.location.origin,
        version: "1",
        chainId: connectedChainId,
        nonce,
        expirationTime: new Date(Date.now() + SIWE_EXPIRATION_MS).toISOString(),
      });

      const message = siweMessage.prepareMessage();

      // Sign with wallet
      const signature = await walletClient.signMessage({
        account: address as `0x${string}`,
        message,
      });

      // Authenticate with backend
      const authResponse = await axios.post(`${CERAMIC_CACHE_ENDPOINT}/authenticate/v2`, {
        message: {
          domain: siweMessage.domain,
          address: siweMessage.address,
          statement: siweMessage.statement,
          uri: siweMessage.uri,
          version: siweMessage.version,
          chainId: siweMessage.chainId,
          nonce: siweMessage.nonce,
          issuedAt: siweMessage.issuedAt,
          expirationTime: siweMessage.expirationTime,
        },
        signature,
      });

      const accessToken = authResponse.data?.access as string;
      updateIntercomUserData({ address });
      setConnectedAddress(address);
      return accessToken;
    } catch (error) {
      const msg = `Failed to authenticate user with address: ${address}. Error: ${error}`;
      datadogRum.addError(msg);
      throw new Error(msg);
    }
  };

  const loadDbAccessToken = useCallback(async (address: string, walletClient: WalletClient) => {
    const dbCacheTokenKey = `dbcache-token-${address}`;

    // Check for existing valid token first (session continuity)
    const existingToken = window.localStorage.getItem(dbCacheTokenKey);
    if (existingToken) {
      if (isTokenValid(existingToken)) {
        setDbAccessToken(existingToken);
        setDbAccessTokenStatus("connected");
        setUserAddress(address);

        // Set up session validity check
        setCheckSessionIsValid(() => () => isTokenValid(existingToken));
        return;
      } else {
        // Clear invalid token (e.g., old HS256 token or expired)
        window.localStorage.removeItem(dbCacheTokenKey);
      }
    }

    // Need to get a new access token
    try {
      const dbAccessToken = await getPassportDatabaseAccessToken(address, walletClient);
      // Store the token in localStorage
      window.localStorage.setItem(dbCacheTokenKey, dbAccessToken);
      setDbAccessToken(dbAccessToken);
      setDbAccessTokenStatus("connected");
      setUserAddress(address);

      // Set up session validity check
      setCheckSessionIsValid(() => () => isTokenValid(dbAccessToken));
    } catch (error) {
      setDbAccessTokenStatus("failed");

      const msg = `Error getting access token for address: ${address}`;
      console.error("Error getting access token:", error);
      datadogRum.addError(msg);

      throw error;
    }
  }, []);

  const connect = useCallback(
    async (address: string, walletClient: WalletClient) => {
      if (address) {
        try {
          setDbAccessTokenStatus("connecting");
          await loadDbAccessToken(address, walletClient);
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
    localStorage.removeItem(`dbcache-token-${address}`);
  };

  return {
    userAddress,
    connect,
    disconnect,
    dbAccessToken,
    dbAccessTokenStatus,
    checkSessionIsValid,
  };
};

export const DatastoreConnectionContextProvider = ({ children }: { children: any }) => {
  const { dbAccessToken, dbAccessTokenStatus, disconnect, connect, userAddress, checkSessionIsValid } =
    useDatastoreConnection();

  const providerProps = useMemo(
    () => ({
      userAddress,
      connect,
      disconnect,
      dbAccessToken,
      dbAccessTokenStatus,
      checkSessionIsValid,
    }),
    [dbAccessToken, dbAccessTokenStatus, userAddress, connect, disconnect, checkSessionIsValid]
  );

  return <DatastoreConnectionContext.Provider value={providerProps}>{children}</DatastoreConnectionContext.Provider>;
};

export const useDatastoreConnectionContext = () => useContext(DatastoreConnectionContext);
