// --- React Methods
import React, { createContext, useMemo, useState, useEffect } from "react";
import { useConnectWallet } from "@web3-onboard/react";

// --- Wallet connection utilities
import { initWeb3Onboard } from "../utils/onboard";
import { Passport, Stamp, PROVIDER_ID } from "@gitcoin/passport-types";

// --- Data Storage Functions
import { OnboardAPI, WalletState } from "@web3-onboard/core/dist/types";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";

// --- Data Storage Functions
import { CeramicDatabase } from "@gitcoin/passport-database-client";
import { ProviderSpec, STAMP_PROVIDERS } from "../config/providers";

// -- Ceramic and Glazed
import { EthereumAuthProvider } from "@self.id/web";
import { useViewerConnection } from "@self.id/framework";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

// -- Trusted IAM servers DID
const IAM_ISSUER_DID = process.env.NEXT_PUBLIC_DPOPP_IAM_ISSUER_DID || "";

export type AllProvidersState = {
  [provider in PROVIDER_ID]?: {
    providerSpec: ProviderSpec;
    stamp?: Stamp;
  };
};

const startingAllProvidersState: AllProvidersState = {
  Google: {
    providerSpec: STAMP_PROVIDERS.Google,
    stamp: undefined,
  },
  Ens: {
    providerSpec: STAMP_PROVIDERS.Ens,
    stamp: undefined,
  },
  Poh: {
    providerSpec: STAMP_PROVIDERS.Poh,
    stamp: undefined,
  },
  Twitter: {
    providerSpec: STAMP_PROVIDERS.Twitter,
    stamp: undefined,
  },
  POAP: {
    providerSpec: STAMP_PROVIDERS.POAP,
    stamp: undefined,
  },
  Facebook: {
    providerSpec: STAMP_PROVIDERS.Facebook,
    stamp: undefined,
  },
  Brightid: {
    providerSpec: STAMP_PROVIDERS.Brightid,
    stamp: undefined,
  },
  Github: {
    providerSpec: STAMP_PROVIDERS.Github,
    stamp: undefined,
  },
};

export interface UserContextState {
  loggedIn: boolean;
  passport: Passport | undefined | false;
  isLoadingPassport: boolean | undefined;
  allProvidersState: AllProvidersState;
  handleCreatePassport: () => Promise<void>;
  handleConnection: () => void;
  handleAddStamp: (stamp: Stamp) => Promise<void>;
  address: string | undefined;
  wallet: WalletState | null;
  signer: JsonRpcSigner | undefined;
  walletLabel: string | undefined;
  userDid: string | undefined;
}

const startingState: UserContextState = {
  loggedIn: false,
  passport: {
    issuanceDate: new Date(),
    expiryDate: new Date(),
    stamps: [],
  } as Passport,
  isLoadingPassport: true,
  allProvidersState: startingAllProvidersState,
  handleCreatePassport: async () => {},
  handleConnection: () => {},
  handleAddStamp: async () => {},
  address: undefined,
  wallet: null,
  signer: undefined,
  walletLabel: undefined,
  userDid: undefined,
};

// create our app context
export const UserContext = createContext(startingState);

export const UserContextProvider = ({ children }: { children: any }) => {
  const [loggedIn, setLoggedIn] = useState(false);
  const [passport, setPassport] = useState<Passport | undefined>(undefined);
  const [isLoadingPassport, setIsLoadingPassport] = useState<boolean | undefined>(true);
  const [ceramicDatabase, setCeramicDatabase] = useState<CeramicDatabase | undefined>(undefined);
  const [allProvidersState, setAllProviderState] = useState(startingAllProvidersState);

  const [viewerConnection, ceramicConnect, ceramicDisconnect] = useViewerConnection();

  // Use onboard to control the current provider/wallets
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [web3Onboard, setWeb3Onboard] = useState<OnboardAPI | undefined>();
  const [walletLabel, setWalletLabel] = useState<string | undefined>();
  const [address, setAddress] = useState<string>();
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>();
  const [userDid, setUserDid] = useState<string | undefined>();
  const [loggingIn, setLoggingIn] = useState<boolean | undefined>();

  // clear all state
  const clearState = (): void => {
    setPassport(undefined);
    clearAllProvidersState();
    setWalletLabel(undefined);
    setAddress(undefined);
    setSigner(undefined);
    setCeramicDatabase(undefined);
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
          // connect to ceramic
          await ceramicConnect(new EthereumAuthProvider(wallet.provider, wallet.accounts[0].address));
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
      // clear all state
      clearState();
    } else {
      // clear any verified state
      setPassport(undefined);
      clearAllProvidersState();
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
      case "idle": {
        setCeramicDatabase(undefined);
        break;
      }
      case "connected": {
        const ceramicDatabaseInstance = new CeramicDatabase(
          viewerConnection.selfID.did,
          process.env.NEXT_PUBLIC_CERAMIC_CLIENT_URL,
          undefined,
          datadogLogs.logger
        );
        setCeramicDatabase(ceramicDatabaseInstance);
        setUserDid(ceramicDatabaseInstance.did);
        break;
      }
      case "failed": {
        // user refused to connect to ceramic -- disconnect them
        disconnect({
          label: walletLabel || "",
        });
        console.log("failed to connect self id :(");
        setCeramicDatabase(undefined);
        break;
      }
      default:
        break;
    }
  }, [viewerConnection.status]);

  useEffect(() => {
    if (ceramicDatabase) {
      fetchPassport(ceramicDatabase);
    }
  }, [ceramicDatabase]);

  // Toggle connect/disconnect
  // clear context passport on disconnect
  const handleConnection = (): void => {
    if (!address) {
      connect({})
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
          setPassport(undefined);
          clearAllProvidersState();
          ceramicDisconnect();
          window.localStorage.setItem("connectedWallets", "[]");
        })
        .catch((e) => {
          datadogRum.addError(e);
          throw e;
        });
    }
  };

  // hydrate allProvidersState
  const hydrateAllProvidersState = (passport?: Passport) => {
    if (passport) {
      // set stamps into allProvidersState
      passport.stamps.forEach((stamp: Stamp) => {
        const { provider } = stamp;
        const providerState = allProvidersState[provider];
        if (providerState) {
          const newProviderState = {
            providerSpec: providerState.providerSpec,
            stamp,
          };
          setAllProviderState((prevState) => ({
            ...prevState,
            [provider]: newProviderState,
          }));
        }
      });
    } else {
      clearAllProvidersState();
    }
  };

  const clearAllProvidersState = () => {
    setAllProviderState(startingAllProvidersState);
  };

  const cleanPassport = (
    passport: Passport | undefined | false,
    database: CeramicDatabase
  ): Passport | undefined | false => {
    // clean stamp content if expired or from a different issuer
    if (passport) {
      passport.stamps = passport.stamps.filter((stamp: Stamp) => {
        const has_expired = new Date(stamp.credential.expirationDate) < new Date();
        const has_correct_issuer = stamp.credential.issuer === IAM_ISSUER_DID;
        const has_correct_subject = stamp.credential.credentialSubject.id.toLowerCase() === database.did;

        return !has_expired && has_correct_issuer && has_correct_subject;
      });
    }

    return passport;
  };

  const fetchPassport = async (database: CeramicDatabase): Promise<void> => {
    setIsLoadingPassport(true);
    // fetch, clean and set the new Passport state
    let passport = (await database.getPassport()) as Passport;
    if (passport) {
      passport = cleanPassport(passport, database) as Passport;
      hydrateAllProvidersState(passport);
      setPassport(passport);
      setIsLoadingPassport(false);
    } else if (passport === false) {
      handleCreatePassport();
    } else {
      // something is wrong with Ceramic...
      datadogRum.addError("Ceramic connection failed", { address });
      setPassport(passport);
      // TODO use more expressive loading states
      setIsLoadingPassport(undefined);
    }
  };

  const handleCreatePassport = async (): Promise<void> => {
    if (ceramicDatabase) {
      await ceramicDatabase.createPassport();
      await fetchPassport(ceramicDatabase);
    }
  };

  const handleAddStamp = async (stamp: Stamp): Promise<void> => {
    if (ceramicDatabase) {
      await ceramicDatabase.addStamp(stamp);
      await fetchPassport(ceramicDatabase);
    }
  };

  const stateMemo = useMemo(
    () => ({
      loggedIn,
      address,
      isLoadingPassport,
      passport,
      allProvidersState,
      handleCreatePassport,
      handleConnection,
      handleAddStamp,
      wallet,
      signer,
      walletLabel,
      userDid,
    }),
    [loggedIn, address, passport, isLoadingPassport, signer, wallet, allProvidersState]
  );

  // use props as a way to pass configuration values
  const providerProps = {
    loggedIn,
    address,
    passport,
    isLoadingPassport,
    allProvidersState,
    handleCreatePassport,
    handleConnection,
    handleAddStamp,
    wallet,
    signer,
    walletLabel,
    userDid,
  };

  return <UserContext.Provider value={providerProps}>{children}</UserContext.Provider>;
};
