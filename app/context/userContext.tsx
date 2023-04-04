// --- React Methods
import React, { createContext, useEffect, useMemo, useState } from "react";

// --- Wallet connection utilities
import { useConnectWallet } from "@web3-onboard/react";
import { initWeb3Onboard } from "../utils/onboard";
import { WalletState } from "@web3-onboard/core/dist/types";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { OnboardAPI } from "@web3-onboard/core";

// -- Ceramic and Glazed
import { EthereumAuthProvider } from "@self.id/web";
import { useViewerConnection } from "@self.id/framework";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

import { DIDSession } from "did-session";
import { EthereumWebAuth } from "@didtools/pkh-ethereum";
import { AccountId } from "caip";
import { DID } from "dids";
import { Cacao } from "@didtools/cacao";
import axios from "axios";

export type DbAuthTokenStatus = "idle" | "failed" | "connected" | "connecting";

const MULTICHAIN_ENABLED = process.env.NEXT_PUBLIC_FF_MULTICHAIN_SIGNATURE !== "off";

type UserWarningName = "expiredStamp" | "cacaoError";

export interface UserWarning {
  content: React.ReactNode;
  icon?: React.ReactNode;
  name?: UserWarningName;
  dismissible?: boolean;
}

export interface UserContextState {
  loggedIn: boolean;
  toggleConnection: () => void;
  handleDisconnection: () => void;
  address: string | undefined;
  wallet: WalletState | null;
  signer: JsonRpcSigner | undefined;
  walletLabel: string | undefined;
  dbAccessToken: string | undefined;
  dbAccessTokenStatus: DbAuthTokenStatus;
  loggingIn: boolean;
  userWarning?: UserWarning;
  setUserWarning: (warning?: UserWarning) => void;
}

const startingState: UserContextState = {
  loggedIn: false,
  toggleConnection: () => {},
  handleDisconnection: () => {},
  address: undefined,
  wallet: null,
  signer: undefined,
  walletLabel: undefined,
  dbAccessToken: undefined,
  dbAccessTokenStatus: "idle",
  loggingIn: false,
  userWarning: undefined,
  setUserWarning: () => {},
};

export const pillLocalStorage = (platform?: string): void => {
  const platforms = window.localStorage.getItem("updatedPlatforms");
  const previouslyUpdatedPlatforms = JSON.parse(platforms || "{}");
  if (platform && !previouslyUpdatedPlatforms[platform]) {
    const updatedPlatforms = previouslyUpdatedPlatforms;
    updatedPlatforms[platform] = true;
    window.localStorage.setItem("updatedPlatforms", JSON.stringify(updatedPlatforms));
  }
};

// create our app context
export const UserContext = createContext(startingState);

export const UserContextProvider = ({ children }: { children: any }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [viewerConnection, ceramicConnect, ceramicDisconnect] = useViewerConnection();
  const [userWarning, setUserWarning] = useState<UserWarning | undefined>();

  // Use onboard to control the current provider/wallets
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [web3Onboard, setWeb3Onboard] = useState<OnboardAPI | undefined>();
  const [walletLabel, setWalletLabel] = useState<string | undefined>();
  const [address, setAddress] = useState<string>();
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>();
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [dbAccessToken, setDbAccessToken] = useState<string | undefined>();
  const [dbAccessTokenStatus, setDbAccessTokenStatus] = useState<DbAuthTokenStatus>("idle");

  // clear all state
  const clearState = (): void => {
    setWalletLabel(undefined);
    setAddress(undefined);
    setSigner(undefined);
  };

  // Restore wallet connection from localStorage
  const setWalletFromLocalStorage = async (): Promise<void> => {
    const previouslyConnectedWallets = JSON.parse(
      // retrieve localstorage state
      window.localStorage.getItem("connectedWallets") || "[]"
    ) as string[];
    if (previouslyConnectedWallets?.length) {
      connect({
        autoSelect: {
          label: previouslyConnectedWallets[0],
          disableModals: true,
        },
      }).catch((e): void => {
        throw e;
      });
    }
  };

  // Force user on to Mainnet
  const ensureMainnet = async (): Promise<boolean | undefined> => {
    if (wallet && web3Onboard) {
      // check if wallet is on mainnet
      if ((await wallet.provider.request({ method: "eth_chainId" })) !== "0x1") {
        try {
          // if its not, request that the user moves to mainnet
          return await web3Onboard.setChain({ chainId: "0x1" });
        } catch (e) {
          // if they cancel, return false
          return false;
        }
      } else {
        // already on mainnet
        return true;
      }
    }
    // not connected
    return false;
  };

  const getPassportDatabaseAccessToken = async (did: DID): Promise<string> => {
    let nonce = null;
    try {
      // Get nonce from server
      const nonceResponse = await axios.get(`${process.env.NEXT_PUBLIC_CERAMIC_CACHE_ENDPOINT}account/nonce`);
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
        const authResponse = await axios.post(
          `${process.env.NEXT_PUBLIC_CERAMIC_CACHE_ENDPOINT}ceramic-cache/authenticate`,
          payloadForVerifier
        );
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

  // Attempt to login to Ceramic (on mainnet only)
  const passportLogin = async (): Promise<void> => {
    // check that passportLogin isn't mid-way through
    if (wallet && !loggingIn) {
      // ensure that passport is connected to mainnet
      const hasCorrectChainId = MULTICHAIN_ENABLED ? true : await ensureMainnet();
      // mark that we're attempting to login
      setLoggingIn(true);
      // with loaded chainId
      if (hasCorrectChainId) {
        // store in localstorage
        window.localStorage.setItem("connectedWallets", JSON.stringify([wallet.label]));
        // attempt to connect to ceramic (if it passes or fails always set loggingIn=false)
        try {
          const address = wallet.accounts[0].address;
          const ethAuthProvider = new EthereumAuthProvider(wallet.provider, wallet.accounts[0].address.toLowerCase());

          // Sessions will be serialized and stored in localhost
          // The sessions are bound to an ETH address, this is why we use the address in the session key
          const sessionKey = `didsession-${address}`;
          const dbCacheTokenKey = `dbcache-token-${address}`;
          const sessionStr = window.localStorage.getItem(sessionKey);

          // @ts-ignore
          // When sessionStr is null, this will create a new selfId. We want to avoid this, becasue we want to make sure
          // that chainId 1 is in the did
          let selfId = !!sessionStr ? await ceramicConnect(ethAuthProvider, sessionStr) : null;

          if (
            // @ts-ignore
            !selfId ||
            // @ts-ignore
            !selfId?.client?.session
          ) {
            if (MULTICHAIN_ENABLED) {
              // If the session loaded is not valid, or if it is expired or close to expire, we create
              // a new session
              // Also we enforce the "1" chainId, as we always want to use mainnet dids, in order to avoid confusion
              // as to where a passport / stamp has been stored
              const authMethod = await EthereumWebAuth.getAuthMethod(
                wallet.provider,
                new AccountId({
                  chainId: "eip155:1",
                  address: address,
                })
              );

              const session = await DIDSession.authorize(authMethod, {
                resources: ["ceramic://*"],
              });
              const newSessionStr = session.serialize();

              // @ts-ignore
              selfId = await ceramicConnect(ethAuthProvider, newSessionStr);
            } else {
              // If the session loaded is not valid, or if it is expired or close to expire, we create
              // a new connection to ceramic
              selfId = await ceramicConnect(ethAuthProvider);
            }

            // Store the session in localstorage
            // @ts-ignore
            window.localStorage.setItem(sessionKey, selfId?.client?.session?.serialize());
          } else if (
            // @ts-ignore
            selfId?.client?.session?.isExpired ||
            // @ts-ignore
            selfId?.client?.session?.expireInSecs < 3600
          ) {
            // disconnect from the invalid chain
            await disconnect({
              label: wallet.label || "",
            });
            // then clear local state
            clearState();

            window.localStorage.removeItem(sessionKey);
            window.localStorage.removeItem(dbCacheTokenKey);
          }
        } finally {
          // mark that this login attempt is complete
          setLoggingIn(false);
        }
      } else {
        // disconnect from the invalid chain
        await disconnect({
          label: wallet.label || "",
        });
        // then clear local state
        clearState();
        // finished with this attempt
        setLoggingIn(false);
      }
    }
  };

  // Init onboard to enable hooks
  useEffect((): void => {
    setWeb3Onboard(initWeb3Onboard);
  }, []);

  // Connect wallet on reload
  useEffect((): void => {
    setWalletFromLocalStorage();
  }, []);

  useEffect((): void => {
    const loadDbAccessToken = async () => {
      if (viewerConnection.status === "connected") {
        const dbCacheTokenKey = `dbcache-token-${address}`;
        // TODO: if we load the token from the localstorage we should validate it
        // let dbAccessToken = window.localStorage.getItem(dbCacheTokenKey);
        let dbAccessToken = null;

        // Here we try to get an access token for the Passport database
        // We should get a new access token:
        // 1. if the user has nonde
        // 2. in case a new session has been created (access tokens should expire similar to sessions)
        // TODO: verifying the validity of the access token would also make sense => check the expiration data in the token
        const did = viewerConnection.selfID.did; // selfId?.client?.session?.did;
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
      }
    };
    loadDbAccessToken();
  }, [loggedIn, viewerConnection.status, address]);

  // Update on wallet connect
  useEffect((): void => {
    // no connection
    if (!wallet) {
      clearState();
    } else {
      // record connected wallet details
      setWalletLabel(wallet.label);
      setAddress(wallet.accounts[0].address);
      // get the signer from an ethers wrapped Web3Provider
      setSigner(new Web3Provider(wallet.provider).getSigner());
      // Login to Ceramic
      passportLogin();
      // attach listener
      wallet.provider.on("chainChanged", async (chainId: string): Promise<void> => {
        if (chainId !== "0x1") {
          // logout
          await disconnect({
            label: wallet.label || "",
          }).then(() => {
            clearState();
          });
        }
      });
    }
  }, [wallet]);

  useEffect((): void => {
    switch (viewerConnection.status) {
      case "failed": {
        // user refused to connect to ceramic -- disconnect them
        disconnect({
          label: walletLabel || "",
        });
        console.log("failed to connect self id :(");
        break;
      }
      default:
        break;
    }
  }, [viewerConnection.status]);

  // Toggle connect/disconnect
  const toggleConnection = (): void => {
    if (!address) {
      handleConnection();
    } else {
      handleDisconnection();
    }
  };

  const handleConnection = (): void => {
    connect()
      .then(() => {
        datadogLogs.logger.info("Connected to Wallet");
        setLoggedIn(true);
      })
      .catch((e) => {
        datadogRum.addError(e);
        throw e;
      });
  };

  const handleDisconnection = (): void => {
    disconnect({
      label: walletLabel || "",
    })
      .then(() => {
        setLoggedIn(false);
        ceramicDisconnect();
        window.localStorage.setItem("connectedWallets", "[]");
      })
      .catch((e) => {
        datadogRum.addError(e);
        throw e;
      });
  };

  // use props as a way to pass configuration values
  const providerProps = {
    loggedIn,
    address,
    toggleConnection,
    handleDisconnection,
    wallet,
    signer,
    walletLabel,
    dbAccessToken,
    dbAccessTokenStatus,
    loggingIn,
    userWarning,
    setUserWarning,
  };

  return <UserContext.Provider value={providerProps}>{children}</UserContext.Provider>;
};
