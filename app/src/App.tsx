import React from "react";
import logo from "./logo.svg";
import "./App.css";

function App(): JSX.Element {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <button
          data-testid="connectWalletButton"
          className="bg-yellow-100 text-gray-900"
        >
          Connect Wallet
        </button>
      </header>
    </div>
  );
}

export default App;
