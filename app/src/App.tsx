// --- React Methods
import React, { useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useConnectWallet, useWallets } from "@web3-onboard/react";
import "./App.css";
import { Home, Layout, NoMatch, Passport } from "./views";

// --- Wallet connection utilities
import { initWeb3Onboard } from "./utils/onboard";
import { OnboardAPI, WalletState } from "@web3-onboard/core/dist/types";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";

interface Stamp {
  recordUserName: string;
  credentialIssuer: string;
}

interface Passport {
  issuanceDate: Date;
  expiryDate: Date;
  stamps: Stamp[];
}

export interface UserContextState {
  loggedIn: boolean;
  passport: Passport | undefined;
  handleCreatePassport: () => void;
  handleConnection: () => void;
  address: string | undefined;
  connectedWallets: WalletState[];
  signer: JsonRpcSigner | undefined;
  walletLabel: string | undefined;
}
const startingState: UserContextState = {
  loggedIn: false,
  passport: undefined,
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  handleCreatePassport: () => {},
  /* eslint-disable-next-line @typescript-eslint/no-empty-function */
  handleConnection: () => {},
  address: undefined,
  connectedWallets: [],
  signer: undefined,
  walletLabel: undefined,
};

export const UserContext = React.createContext(startingState);

function App(): JSX.Element {
  const [loggedIn, setLoggedIn] = useState(false);
  const [passport, setPassport] = useState<Passport | undefined>(undefined);

  // Use onboard to control the current provider/wallets
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  // const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
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
          setLoggedIn(false);
        })
        .catch((e) => {
          throw e;
        });
    }
  };

  const handleCreatePassport = (): void => {
    const issuanceDate: Date = new Date();
    const expiryDate: Date = new Date();
    const stamps: Stamp[] = [];

    const newPassport = {
      issuanceDate,
      expiryDate,
      stamps,
    };
    setPassport(newPassport);
  };

  const stateMemo = useMemo(
    () => ({
      loggedIn,
      passport,
      handleCreatePassport,
      handleConnection,
      address,
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
              element={connectedWallets.length > 0 ? <Passport /> : <Navigate replace to="/" />}
            />
            <Route path="*" element={<NoMatch />} />
          </Route>
        </Routes>
      </UserContext.Provider>
    </div>
  );
}

export default App;
