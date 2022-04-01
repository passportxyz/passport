import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";
import dpoppLogofrom from "./assets/dpoppLogo.svg"

import { initWeb3Onboard } from "./utils/onboard";
import { useConnectWallet, useSetChain, useWallets } from "@web3-onboard/react";
import { EIP1193Provider } from "@web3-onboard/common";

function App() {
  // Use onboard to control the current provider/wallets
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  const connectedWallets = useWallets();

  const [web3Onboard, setWeb3Onboard] = useState<any>(null);
  const [label, setLabel] = useState<string | undefined>();
  const [address, setAddress] = useState<string | undefined>();
  const [accounts, setAccounts] = useState<Record<string, any> | undefined>();
  const [provider, setProvider] = useState<EIP1193Provider | undefined>();

  // Init onboard to enable hooks
  useEffect(() => {
    setWeb3Onboard(initWeb3Onboard);
  }, []);

  // Update on wallet connect
  useEffect(() => {
    // no connection
    if (!connectedWallets.length) {
      setLabel(undefined);
      setAddress(undefined);
      setAccounts(undefined);
      setProvider(undefined);
    } else {
      // record details
      setLabel(connectedWallets[0]?.label);
      setAddress(connectedWallets[0]?.accounts[0].address);
      setAccounts(connectedWallets[0]?.accounts);
      setProvider(connectedWallets[0]?.provider);
      // flaten array for storage
      const connectedWalletsLabelArray = connectedWallets.map(
        ({ label }) => label,
      );
      // store in localstorage
      window.localStorage.setItem(
        "connectedWallets",
        JSON.stringify(connectedWalletsLabelArray),
      );
    }
  }, [connectedWallets]);

  // Connect wallet on reload
  useEffect(() => {
    // retrieve localstorage state
    const previouslyConnectedWallets = JSON.parse(
      window.localStorage.getItem("connectedWallets") || "[]",
    ) as string[];
    if (previouslyConnectedWallets?.length) {
      /* eslint-disable no-inner-declarations */
      ////TURN MODAL BACK ON
      async function setWalletFromLocalStorage() {
        await connect({
          autoSelect: {
            label: previouslyConnectedWallets[0],
            disableModals: true,
          },
        });
      }
      // restore from localstorage
      setWalletFromLocalStorage();
    }
  }, [web3Onboard, connect]);

  // Toggle connect/disconnect
  const handleConnection = () => {
    if (!address) {
      connect({});
    } else {
      disconnect({
        label: label || "",
      });
    }
  };

  return (
    <div className="bg-violet-700 font-librefranklin text-gray-100 min-h-max font-miriam-libre min-h-default">
      <div className="container px-5 py-24 mx-auto">
        <div className="mx-auto flex flex-wrap">
          <div className="w-1/2 w-full py-6 mb-6">
              <img src={dpoppLogofrom} className="App-logo" alt="logo" />
                <div className="font-miriam-libre text-gray-050 mt-10 font-normal font-bold leading-relaxed">
                  <p className="text-6xl">
                  Gitcoin
                  <br/>
                  ID Passport
                  </p>
                </div>
                <div className="font-libre-franklin w-1/3 mt-10">Gitcoin ID Passport is an identity aggregator of the top 
                  identity providers in the web3 space into one transportable 
                  identity that proves your personhood.
                </div>

                <div className="mb-10 mt-10">
                <button
                  data-testid="connectWalletButton"
                  className="bg-gray-100 text-violet-500 rounded-lg py-4 px-20"
                  onClick={handleConnection}
                >
                  <p className="text-base">{address ? `Disconnect from ${label || ""}` : "Get Started"}</p>
                </button>
                  {connectedWallets.map(({ label, accounts }) => {
                    return (
                      <div key={label}>
                        <div>{label}</div>
                        <div>Accounts: {JSON.stringify(accounts, null, 2)}</div>
                      </div>
                    );
                  })}
                </div>

                <a className="underline">Why using wallet as identity?</a>
          </div>
          <div className="lg:w-1/2 w-full lg:h-auto h-64 object-cover object-center rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default App;
