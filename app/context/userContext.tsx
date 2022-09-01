// --- React Methods
import React, { createContext, useEffect, useMemo, useState } from "react";

// --- Wallet connection utilities
import { useConnectWallet } from "@web3-onboard/react";
import { initWeb3Onboard } from "../utils/onboard";
import { OnboardAPI, WalletState } from "@web3-onboard/core/dist/types";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";

// -- Ceramic and Glazed
import { EthereumAuthProvider } from "@self.id/web";
import { useViewerConnection } from "@self.id/framework";
import { DIDSession } from "@glazed/did-session";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

export interface UserContextState {
  loggedIn: boolean;
  handleConnection: () => void;
  address: string | undefined;
  wallet: WalletState | null;
  signer: JsonRpcSigner | undefined;
  walletLabel: string | undefined;
}

const startingState: UserContextState = {
  loggedIn: false,
  handleConnection: () => {},
  address: undefined,
  wallet: null,
  signer: undefined,
  walletLabel: undefined,
};

// create our app context
export const UserContext = createContext(startingState);

export const UserContextProvider = ({ children }: { children: any }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [viewerConnection, ceramicConnect, ceramicDisconnect] = useViewerConnection();

  // Use onboard to control the current provider/wallets
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [web3Onboard, setWeb3Onboard] = useState<OnboardAPI | undefined>();
  const [walletLabel, setWalletLabel] = useState<string | undefined>();
  const [address, setAddress] = useState<string>();
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>();
  const [loggingIn, setLoggingIn] = useState<boolean | undefined>();

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

  // Attempt to login to Ceramic (on mainnet only)
  const passportLogin = async (): Promise<void> => {
    // check that passportLogin isnt mid-way through
    if (wallet && !loggingIn) {
      // ensure that passport is connected to mainnet
      const hasCorrectChainId = await ensureMainnet();
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
          const sessionStr = localStorage.getItem(sessionKey);
      
          // @ts-ignore
          let selfId = await ceramicConnect(ethAuthProvider, sessionStr);

          if (
            // @ts-ignore
            !selfId?.client?.session ||
            // @ts-ignore
            selfId?.client?.session?.isExpired ||
            // @ts-ignore
            selfId?.client?.session?.expireInSecs < 3600
          ) {
            // If the session loaded is not valid, or if it is expired or close to expire, we create
            // a new connection to ceramic
            selfId = await ceramicConnect(ethAuthProvider);
          }

          // Store the session in localstorage
          // @ts-ignore
          localStorage.setItem(sessionKey, selfId?.client?.session?.serialize());
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
  }, [setWalletFromLocalStorage]);

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
  const handleConnection = (): void => {
    if (!address) {
      connect()
        .then(() => {
          datadogLogs.logger.info("Connected to Wallet");
          setLoggedIn(true);
        })
        .catch((e) => {
          datadogRum.addError(e);
          throw e;
        });
    } else {
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
    }
  };

  const stateMemo = useMemo(
    () => ({
      loggedIn,
      address,
      handleConnection,
      wallet,
      signer,
      walletLabel,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loggedIn, address, signer, wallet]
  );

  // use props as a way to pass configuration values
  const providerProps = {
    loggedIn,
    address,
    handleConnection,
    wallet,
    signer,
    walletLabel,
  };

  return <UserContext.Provider value={providerProps}>{children}</UserContext.Provider>;
};
