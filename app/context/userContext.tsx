// --- React Methods
import React, { createContext, useMemo, useState, useEffect } from "react";
import { useConnectWallet, useWallets } from "@web3-onboard/react";

// --- Wallet connection utilities
import { initWeb3Onboard } from "../utils/onboard";
import { Passport, Stamp, PROVIDER_ID } from "@dpopp/types";

// --- Data Storage Functions
import { OnboardAPI, WalletState } from "@web3-onboard/core/dist/types";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";

// --- Data Storage Functions
import { CeramicDatabase } from "@dpopp/database-client/dist/esm/src";
// import { LocalStorageDatabase } from "../services/databaseStorage";
import { ProviderSpec, STAMP_PROVIDERS } from "../config/providers";

// -- Ceramic and Glazed
import { EthereumAuthProvider } from "@self.id/web";
import { useViewerConnection } from "@self.id/framework";

export type AllProvidersState = {
  [provider in PROVIDER_ID]: {
    providerSpec: ProviderSpec;
    stamp?: Stamp;
  };
};

const startingAllProvidersState: AllProvidersState = {
  Google: {
    providerSpec: STAMP_PROVIDERS.Google,
    stamp: undefined,
  },
  Simple: {
    providerSpec: STAMP_PROVIDERS.Simple,
    stamp: undefined,
  },
};

export interface UserContextState {
  loggedIn: boolean;
  passport: Passport | undefined;
  isLoadingPassport: boolean;
  allProvidersState: AllProvidersState;
  getStampIndex: (stamp: Stamp) => number | undefined;
  hasStamp: (provider: string) => boolean;
  handleCreatePassport: () => void;
  handleSaveStamp: (stamp: Stamp) => void;
  handleConnection: () => void;
  handleAddStamp: (stamp: Stamp) => void;
  address: string | undefined;
  connectedWallets: WalletState[];
  signer: JsonRpcSigner | undefined;
  walletLabel: string | undefined;
}
const startingState: UserContextState = {
  loggedIn: false,
  passport: undefined,
  isLoadingPassport: true,
  allProvidersState: startingAllProvidersState,
  getStampIndex: () => undefined,
  hasStamp: () => false,
  handleCreatePassport: () => {},
  handleSaveStamp: () => {},
  handleConnection: () => {},
  handleAddStamp: () => {},
  address: undefined,
  connectedWallets: [],
  signer: undefined,
  walletLabel: undefined,
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
  const connectedWallets = useWallets();
  const [web3Onboard, setWeb3Onboard] = useState<OnboardAPI | undefined>();
  const [walletLabel, setWalletLabel] = useState<string | undefined>();
  const [address, setAddress] = useState<string>();
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>();

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
    if (!connectedWallets.length) {
      setWalletLabel(undefined);
      setAddress(undefined);
      setSigner(undefined);
      setCeramicDatabase(undefined);
    } else {
      // record connected wallet details
      setWalletLabel(wallet?.label);
      setAddress(wallet?.accounts[0].address);
      // get the signer from an ethers wrapped Web3Provider
      setSigner(new Web3Provider(connectedWallets[0]?.provider).getSigner());
      // flaten array for storage
      const connectedWalletsLabelArray = connectedWallets.map(({ label }) => label);
      // store in localstorage
      window.localStorage.setItem("connectedWallets", JSON.stringify(connectedWalletsLabelArray));

      if (wallet) {
        const ethereumProvider = wallet.provider;
        ceramicConnect(new EthereumAuthProvider(ethereumProvider, wallet?.accounts[0].address));
      }
    }
  }, [connectedWallets, wallet]);

  useEffect(() => {
    switch (viewerConnection.status) {
      case "idle": {
        setCeramicDatabase(undefined);
        break;
      }
      case "connected": {
        const ceramicDatabaseInstance = new CeramicDatabase(viewerConnection.selfID.did);
        setCeramicDatabase(ceramicDatabaseInstance);
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
          setLoggedIn(true);
        })
        .catch((e) => {
          throw e;
        });
    } else {
      disconnect({
        label: walletLabel || "",
      })
        .then(() => {
          ceramicDisconnect();
          window.localStorage.setItem("connectedWallets", "[]");
          setPassport(undefined);
          setLoggedIn(false);
        })
        .catch((e) => {
          throw e;
        });
    }
  };

  // hydrate allProvidersState
  useEffect(() => {
    passport?.stamps.forEach((stamp: Stamp) => {
      const { provider } = stamp;
      const providerState = allProvidersState[provider];
      const newProviderState = {
        providerSpec: providerState.providerSpec,
        stamp,
      };
      setAllProviderState((prevState) => ({
        ...prevState,
        [provider]: newProviderState,
      }));
    });
    // TODO remove providerstate on stamp removal
  }, [passport]);

  const fetchPassport = (database: CeramicDatabase): void => {
    console.log("attempting to fetch from ceramic...");
    setIsLoadingPassport(true);
    database
      .getPassport()
      .then((passport) => {
        setPassport(passport);
      })
      .finally(() => setIsLoadingPassport(false));
  };

  const handleCreatePassport = (): void => {
    if (ceramicDatabase) {
      ceramicDatabase.createPassport().then(() => {
        fetchPassport(ceramicDatabase);
      });
    }
  };

  const handleAddStamp = (stamp: Stamp): void => {
    if (ceramicDatabase) {
      ceramicDatabase.addStamp(stamp).then(() => {
        fetchPassport(ceramicDatabase);
      });
    }
  };

  // TODO: add a 'save'/'update' method to Database Client - currently this won't save
  const handleSaveStamp = (stamp: Stamp): void => {
    if (passport) {
      // check if there is already a stamp recorded for this provider
      const stampIndex = getStampIndex(stamp);
      // place the new stamp into the stamps array
      if (stampIndex !== undefined && stampIndex !== -1) {
        passport.stamps[stampIndex] = stamp;
      } else {
        passport.stamps.push(stamp);
      }
      // propagate the new passport state
      setPassport({ ...passport });
    }
  };

  const getStampIndex = (stamp: Stamp): number | undefined => {
    // check if there is already a stamp recorded for this provider
    return passport?.stamps.findIndex((_stamp: Stamp) => _stamp.provider === stamp.provider);
  };

  const hasStamp = (provider: string): boolean => {
    // check if a stamp exists for a given provider
    return !!passport?.stamps && getStampIndex({ provider } as unknown as Stamp) !== -1;
  };

  const stateMemo = useMemo(
    () => ({
      loggedIn,
      address,
      isLoadingPassport,
      passport,
      allProvidersState,
      handleCreatePassport,
      handleSaveStamp,
      handleConnection,
      getStampIndex,
      hasStamp,
      handleAddStamp,
      connectedWallets,
      signer,
      walletLabel,
    }),
    [loggedIn, address, passport, isLoadingPassport, signer, connectedWallets, allProvidersState]
  );

  // use props as a way to pass configuration values
  const providerProps = {
    loggedIn,
    address,
    passport,
    isLoadingPassport,
    allProvidersState,
    handleCreatePassport,
    handleSaveStamp,
    handleConnection,
    getStampIndex,
    hasStamp,
    handleAddStamp,
    connectedWallets,
    signer,
    walletLabel,
  };

  return <UserContext.Provider value={providerProps}>{children}</UserContext.Provider>;
};
