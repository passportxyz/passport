// --- React Methods
import React, { createContext, useMemo, useState, useEffect } from "react";
import { useConnectWallet } from "@web3-onboard/react";

// --- Wallet connection utilities
import { initWeb3Onboard } from "../utils/onboard";
import { Passport, Stamp, PROVIDER_ID } from "@dpopp/types";

// --- Data Storage Functions
import { OnboardAPI, WalletState } from "@web3-onboard/core/dist/types";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";

// --- Data Storage Functions
import { CeramicDatabase } from "@dpopp/database-client";
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
};

export interface UserContextState {
  loggedIn: boolean;
  passport: Passport | undefined | false;
  isLoadingPassport: boolean;
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
  const [isLoadingPassport, setIsLoadingPassport] = useState(true);
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

  // Init onboard to enable hooks
  useEffect((): void => {
    setWeb3Onboard(initWeb3Onboard);
  }, []);

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

  // Connect wallet on reload
  useEffect((): void => {
    setWalletFromLocalStorage();
  }, []);

  // Update on wallet connect
  useEffect((): void => {
    // no connection
    if (!wallet) {
      // clear all state
      setPassport(undefined);
      clearAllProvidersState();
      setWalletLabel(undefined);
      setAddress(undefined);
      setSigner(undefined);
      setCeramicDatabase(undefined);
    } else {
      // clear any verified state
      setPassport(undefined);
      clearAllProvidersState();
      setIsLoadingPassport(true);
      // record connected wallet details
      setWalletLabel(wallet.label);
      setAddress(wallet.accounts[0].address);
      // get the signer from an ethers wrapped Web3Provider
      setSigner(new Web3Provider(wallet.provider).getSigner());
      // store in localstorage
      window.localStorage.setItem("connectedWallets", JSON.stringify([wallet.label]));

      const ethereumProvider = wallet.provider;
      ceramicConnect(new EthereumAuthProvider(ethereumProvider, wallet.accounts[0].address));
    }
  }, [wallet]);

  useEffect(() => {
    switch (viewerConnection.status) {
      case "idle": {
        setCeramicDatabase(undefined);
        break;
      }
      case "connected": {
        const ceramicDatabaseInstance = new CeramicDatabase(
          viewerConnection.selfID.did,
          process.env.NEXT_PUBLIC_CERAMIC_CLIENT_URL
        );
        setCeramicDatabase(ceramicDatabaseInstance);
        setUserDid(ceramicDatabaseInstance.did);
        fetchPassport(ceramicDatabaseInstance);
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

  // Toggle connect/disconnect
  // clear context passport on disconnect
  const handleConnection = (): void => {
    if (!address) {
      connect({})
        .then(() => {
          datadogLogs.logger.info("Connected to Ceramic");
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
    // fetch, clean and set the new Passport state
    let passport = (await database.getPassport()) as Passport;
    if (passport) {
      passport = cleanPassport(passport, database) as Passport;
      hydrateAllProvidersState(passport);
    } else if (passport === false) {
      handleCreatePassport();
    } else {
      // something is wrong with Ceramic...
      datadogLogs.logger.info("Ceramic connection failed", { address });
      // no ceramic...
      setAddress(undefined);
      handleConnection();
    }
    setPassport(passport);
    setIsLoadingPassport(false);
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
