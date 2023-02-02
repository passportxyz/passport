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
import { DID, DagJWS } from "dids";
import { Cacao } from "@didtools/cacao";
import * as KeyResolver from "key-did-resolver";
import { CID } from "multiformats/cid";

export interface UserContextState {
  loggedIn: boolean;
  toggleConnection: () => void;
  handleDisconnection: () => void;
  address: string | undefined;
  wallet: WalletState | null;
  signer: JsonRpcSigner | undefined;
  walletLabel: string | undefined;
}

const startingState: UserContextState = {
  loggedIn: false,
  toggleConnection: () => {},
  handleDisconnection: () => {},
  address: undefined,
  wallet: null,
  signer: undefined,
  walletLabel: undefined,
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
    // check that passportLogin isn't mid-way through
    if (wallet && !loggingIn) {
      // ensure that passport is connected to mainnet
      const hasCorrectChainId = process.env.NEXT_PUBLIC_FF_MULTICHAIN_SIGNATURE === "on" ? true : await ensureMainnet();
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
          // const sessionStr = window.localStorage.getItem(sessionKey);

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
            if (process.env.NEXT_PUBLIC_FF_MULTICHAIN_SIGNATURE === "on") {
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
              console.log("geri session.cacao:", session.cacao);
              const newSessionStr = session.serialize();
              console.log("geri newSessionStr:", newSessionStr);
              console.log("geri did:", session.did);

              const payloadToSign = { data: "TODO" };

              // const did1 = new DID({ parent: did.parent, resolver: KeyResolver.getResolver() });
              const did = session.did;

              // sign the payload as dag-jose
              const { jws, linkedBlock, cacaoBlock } = await did.createDagJWS(payloadToSign);

              // Get the JWS & serialize it (this is what we would send to the BE)
              const { link, payload, signatures } = jws;
              console.log("---- JSON.stringify(signatures)", JSON.stringify(signatures));
              console.log("---- JSON.stringify(payload)", JSON.stringify(payload));
              console.log("---- JSON.stringify(jws.link?.bytes)", JSON.stringify(Array.from(link ? link.bytes : [])));
              console.log("---- JSON.stringify(cacao)", JSON.stringify(Array.from(cacaoBlock ? cacaoBlock : [])));

              // Load some a JSON serialized JWS (this we would do on the BE)
              const os_signature = JSON.parse(JSON.stringify(signatures));
              const os_payload = JSON.parse(JSON.stringify(payload));
              const os_cid = new Uint8Array(JSON.parse(JSON.stringify(Array.from(link ? link.bytes : []))));
              const os_cacao = new Uint8Array(JSON.parse(JSON.stringify(Array.from(cacaoBlock ? cacaoBlock : []))));

              const s_signature = [
                {
                  protected:
                    "eyJhbGciOiJFZERTQSIsImNhcCI6ImlwZnM6Ly9iYWZ5cmVpZXpnY3M1c3FxaHI0ZXA1ajVjNjdpaWVzNGtwMnZwanAzdzY2d2U3NW1sZXhiZ25vdnVpbSIsImtpZCI6ImRpZDprZXk6ejZNa201dzVDU2pUc1hIWlJZUUhKdkpEemtjaWM5cG9EeFRSZ2M0S3lEWlJ3WFhiI3o2TWttNXc1Q1NqVHNYSFpSWVFISnZKRHprY2ljOXBvRHhUUmdjNEt5RFpSd1hYYiJ9",
                  signature: "oKrQe4G_5_vLyeEx7QBxJgF3XqzUBMHMinh8HbnJGQ_eYrz73_gpsKsvnazzttK1vBDKGUT-wUX8VUqnjmGZCQ",
                },
              ];
              const s_payload = "AXESINDmZIeFXbbpBQWH1bXt7F2Ysg03pRcvzsvSc7vMNurc";
              const s_cid = new Uint8Array([
                1, 113, 18, 32, 208, 230, 100, 135, 133, 93, 182, 233, 5, 5, 135, 213, 181, 237, 236, 93, 152, 178, 13,
                55, 165, 23, 47, 206, 203, 210, 115, 187, 204, 54, 234, 220,
              ]);
              const s_cacao = await Cacao.fromBlockBytes(
                new Uint8Array([
                  163, 97, 104, 161, 97, 116, 103, 101, 105, 112, 52, 51, 54, 49, 97, 112, 169, 99, 97, 117, 100, 120,
                  56, 100, 105, 100, 58, 107, 101, 121, 58, 122, 54, 77, 107, 109, 53, 119, 53, 67, 83, 106, 84, 115,
                  88, 72, 90, 82, 89, 81, 72, 74, 118, 74, 68, 122, 107, 99, 105, 99, 57, 112, 111, 68, 120, 84, 82,
                  103, 99, 52, 75, 121, 68, 90, 82, 119, 88, 88, 98, 99, 101, 120, 112, 120, 24, 50, 48, 50, 51, 45, 48,
                  50, 45, 48, 56, 84, 50, 48, 58, 48, 55, 58, 52, 49, 46, 55, 49, 55, 90, 99, 105, 97, 116, 120, 24, 50,
                  48, 50, 51, 45, 48, 50, 45, 48, 49, 84, 50, 48, 58, 48, 55, 58, 52, 49, 46, 55, 49, 55, 90, 99, 105,
                  115, 115, 120, 59, 100, 105, 100, 58, 112, 107, 104, 58, 101, 105, 112, 49, 53, 53, 58, 49, 58, 48,
                  120, 56, 53, 102, 102, 48, 49, 99, 102, 102, 49, 53, 55, 49, 57, 57, 53, 50, 55, 53, 50, 56, 55, 56,
                  56, 101, 99, 52, 101, 97, 54, 51, 51, 54, 54, 49, 53, 99, 57, 56, 57, 101, 110, 111, 110, 99, 101,
                  106, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 102, 100, 111, 109, 97, 105, 110, 105, 108, 111, 99, 97,
                  108, 104, 111, 115, 116, 103, 118, 101, 114, 115, 105, 111, 110, 97, 49, 105, 114, 101, 115, 111, 117,
                  114, 99, 101, 115, 129, 107, 99, 101, 114, 97, 109, 105, 99, 58, 47, 47, 42, 105, 115, 116, 97, 116,
                  101, 109, 101, 110, 116, 108, 72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100, 33, 97, 115, 162,
                  97, 115, 120, 132, 48, 120, 52, 99, 55, 53, 50, 51, 51, 54, 56, 54, 57, 49, 99, 101, 102, 102, 49, 99,
                  51, 98, 56, 52, 101, 54, 56, 55, 100, 50, 54, 53, 56, 53, 101, 55, 57, 99, 50, 98, 56, 55, 102, 54,
                  100, 57, 97, 56, 56, 99, 99, 98, 54, 50, 51, 97, 56, 54, 48, 48, 54, 52, 53, 48, 55, 54, 53, 55, 97,
                  102, 55, 102, 101, 56, 100, 49, 54, 51, 54, 56, 55, 101, 52, 49, 50, 57, 54, 97, 99, 98, 48, 49, 100,
                  98, 102, 55, 97, 56, 51, 57, 53, 101, 100, 53, 57, 53, 57, 50, 51, 57, 52, 101, 53, 99, 102, 99, 56,
                  48, 98, 97, 54, 53, 52, 102, 53, 52, 54, 50, 97, 48, 49, 98, 97, 116, 102, 101, 105, 112, 49, 57, 49,
                ])
              );

              const jws_restored = {
                signatures: s_signature,
                payload: s_payload,
                cid: CID.decode(s_cid),
              } as DagJWS;

              if (cacaoBlock) {
                const cacao = await Cacao.fromBlockBytes(cacaoBlock);
                const issuer = cacao.p.iss;
                console.log("----- cacao:", cacao);
                console.log("----- cacao.p.iss:", cacao.p.iss);

                try {
                  const verifyResult = await did.verifyJWS(jws, {
                    issuer,
                    capability: cacao,
                  });
                  console.log("verifyResult:", verifyResult); // I am not sure how to verify that the issuer matches the expected one here
                } catch (error) {
                  console.error("Error 1", error);
                }

                try {
                  const verifyResult = await did.verifyJWS(jws_restored, {
                    issuer,
                    capability: s_cacao,
                    disableTimecheck: true,
                  });
                  console.log("verifyResult - restored stuff:", verifyResult); // I am not sure how to verify that the issuer matches the expected one here
                } catch (error) {
                  console.error("Error 2", error);
                }

                // const did1 = new DID({ parent: did.parent, resolver: KeyResolver.getResolver() });
                const did1 = new DID({ resolver: KeyResolver.getResolver() });
                try {
                  const verifyResult = await did1.verifyJWS(jws_restored, {
                    issuer: "did:pkh:eip155:1:0x85ff01cff157199527528788ec4ea6336615c989",
                    capability: s_cacao,
                    disableTimecheck: true,
                  });
                  console.log("verifyResult - issuer", issuer);
                  console.log("verifyResult - restored stuff with did1:", verifyResult); // I am not sure how to verify that the issuer matches the expected one here
                } catch (error) {
                  console.error("Error 2", error);
                }

                try {
                  const verifyResultBad = await did.verifyJWS(jws, {
                    issuer: "did:pkh:eip155:1:0x4a13f4394cf05a52128bda527664429d5376c67f",
                    capability: cacao,
                  });
                  console.log("verifyResultBad:", verifyResultBad); // I am not sure how to verify that the issuer matches the expected one here
                } catch (error) {
                  console.error("Error 3", error);
                }

                const payloadForVerifier = {
                  signatures: JSON.stringify(signatures),
                  payload: JSON.stringify(payload),
                  cid: JSON.stringify(Array.from(link ? link.bytes : [])),
                  cacao: JSON.stringify(Array.from(cacaoBlock ? cacaoBlock : [])),
                  issuer: cacao.p.iss,
                }
  
              }

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

  const stateMemo = useMemo(
    () => ({
      loggedIn,
      address,
      toggleConnection,
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
    toggleConnection,
    handleDisconnection,
    wallet,
    signer,
    walletLabel,
  };

  return <UserContext.Provider value={providerProps}>{children}</UserContext.Provider>;
};
