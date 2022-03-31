import React, { useState } from "react";
import logo from "./logo.svg";
import "./App.css";
import Web3Modal from "web3modal";
// import WalletConnectProvider from "@walletconnect/web3-provider";

function App() {
  const web3Modal = new Web3Modal({
    network: "rinkeby",
    providerOptions: {},
    disableInjectedProvider: false,
  });

  const web3ModalConnect = async (): Promise<void> => {
    console.log("inside button");
    if (web3Modal) {
      console.log("about to connect");
      const provider = await web3Modal.connect();
      // const wrappedProvider = new Web3Provider(provider);
      // return wrappedProvider;
      console.log("connected");
      console.log(provider);
    }
  };
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button
          data-testid="connectWalletButton"
          className="bg-yellow-100 text-gray-900"
          onClick={web3ModalConnect}
        >
          Connect Wallet
        </button>
      </header>
    </div>
  );
}

export default App;
