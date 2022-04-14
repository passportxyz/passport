// --- React Methods
import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useConnectWallet, useWallets } from "@web3-onboard/react";
import "./App.css";
import { Dashboard, Home, Layout, NoMatch } from "./views";

// --- Wallet connection utilities
import { initWeb3Onboard } from "./utils/onboard";
import { OnboardAPI, WalletState } from "@web3-onboard/core/dist/types";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";
import { Passport, Stamp } from "@dpopp/types";

// --- Data Storage Functions
import { LocalStorageDatabase } from "./services/databaseStorage";

export interface UserContextState {
  loggedIn: boolean;
  passport: Passport | undefined;
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
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  getStampIndex: () => undefined,
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  hasStamp: () => false,
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  handleCreatePassport: () => {},
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  handleSaveStamp: () => {},
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  handleConnection: () => {},
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  handleAddStamp: () => {},
  address: undefined,
  connectedWallets: [],
  signer: undefined,
  walletLabel: undefined,
};

export const UserContext = React.createContext(startingState);

function App(): JSX.Element {
  const [loggedIn, setLoggedIn] = useState(false);
  const [passport, setPassport] = useState<Passport | undefined>(undefined);
  const [localStorageDatabase, setLocalStorageDatabase] = useState<LocalStorageDatabase | undefined>(undefined);

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

  // Update on wallet connect
  useEffect((): void => {
    // no connection
    if (!connectedWallets.length) {
      setWalletLabel(undefined);
      setAddress(undefined);
      setSigner(undefined);
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

      if (address) {
        // Load localStorage Passport data
        const localStorageInstance = new LocalStorageDatabase(address);
        setLocalStorageDatabase(localStorageInstance);
        const loadedPassport = localStorageInstance?.getPassport(localStorageInstance.passportKey);
        setPassport(loadedPassport);
      }
    }
  }, [connectedWallets, wallet]);

  // Connect wallet on reload
  useEffect((): void => {
    // retrieve localstorage state
    const previouslyConnectedWallets = JSON.parse(window.localStorage.getItem("connectedWallets") || "[]") as string[];
    if (previouslyConnectedWallets?.length) {
      /* eslint-disable no-inner-declarations */
      async function setWalletFromLocalStorage(): Promise<void> {
        void (await connect({
          autoSelect: {
            label: previouslyConnectedWallets[0],
            disableModals: true,
          },
        }));
      }
      // restore from localstorage
      setWalletFromLocalStorage().catch((e): void => {
        throw e;
      });
    }
  }, [web3Onboard, connect]);

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
          window.localStorage.setItem("connectedWallets", "[]");
          setPassport(undefined);
          setLoggedIn(false);
        })
        .catch((e) => {
          throw e;
        });
    }
  };

  const handleCreatePassport = (): void => {
    if (localStorageDatabase) {
      const passportDid = localStorageDatabase.createPassport();
      const getPassport = localStorageDatabase.getPassport(passportDid);
      setPassport(getPassport);
    }
  };

  const handleAddStamp = (stamp: Stamp): void => {
    if (localStorageDatabase) {
      localStorageDatabase.addStamp(localStorageDatabase.passportKey, stamp);
      const getPassport = localStorageDatabase.getPassport(localStorageDatabase.passportKey);
      setPassport(getPassport);
    }
  };

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
    return passport?.stamps.findIndex((_stamp) => _stamp.provider === stamp.provider);
  };

  const hasStamp = (provider: string): boolean => {
    // check if a stamp exists for a given provider
    return !!passport?.stamps && getStampIndex({ provider } as unknown as Stamp) !== -1;
  };

  const stateMemo = useMemo(
    () => ({
      loggedIn,
      address,
      passport,
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
    [loggedIn, address, passport, signer, connectedWallets]
  );

  return (
    <div>
      <UserContext.Provider value={stateMemo}>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={connectedWallets.length > 0 ? <Navigate replace to="/dashboard" /> : <Home />} />
            <Route
              path="dashboard"
              element={connectedWallets.length > 0 ? <Dashboard /> : <Navigate replace to="/" />}
            />
            <Route path="*" element={<NoMatch />} />
          </Route>
        </Routes>
      </UserContext.Provider>
    </div>
  );
}

export default App;
