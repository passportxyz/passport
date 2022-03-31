import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import { useOnboard } from "use-onboard";
import Onboard from "@web3-onboard/core";
import injectedModule from "@web3-onboard/injected-wallets";

function App() {
  // in case you are authorized before this won't ask to login from the wallet
  const { selectWallet, address, isWalletSelected, disconnectWallet, balance } =
    useOnboard({
      options: {
        dappId: process.env.DAPP_ID, // optional API key
        // networkId: 1, // Ethereum network ID
        networkId: 4, // rinkeby
      },
    });

  const onboardConnect = async () => {
    if (isWalletSelected) disconnectWallet();
    else await selectWallet();
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button
          data-testid="connectWalletButton"
          className="bg-yellow-100 text-gray-900"
          onClick={onboardConnect}
        >
          {isWalletSelected ? "Disconnect" : "Connect"}
        </button>
      </header>
    </div>
  );
}

export default App;
