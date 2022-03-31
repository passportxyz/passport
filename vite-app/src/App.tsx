import React, { useState, useEffect } from "react";
import logo from "./logo.svg";
import "./App.css";

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
      async function setWalletFromLocalStorage() {
        await connect({
          autoSelect: {
            label: previouslyConnectedWallets[0],
            disableModals: false,
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
    <div className="App">
      <img src={logo} className="App-logo" alt="logo" />
      <button
        data-testid="connectWalletButton"
        className="bg-yellow-100 text-gray-900"
        onClick={handleConnection}
      >
        {address ? `Disconnect from ${label || ""}` : "Connect"}
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
  );
}

export default App;
