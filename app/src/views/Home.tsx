// --- React Methods
import React, { useContext } from "react";

// --- Assets/Artefacts
import dpoppLogofrom from "../assets/dpoppLogo.svg";
import { UserContext } from "../App";

export function Home(): JSX.Element {
  const { handleConnection, address, walletLabel } = useContext(UserContext);

  return (
    <div className="mx-auto flex flex-wrap">
      <div className="w-1/2 w-full py-6 mb-6">
        <img src={dpoppLogofrom} className="App-logo" alt="logo" />
        <div className="font-miriam-libre text-gray-050 mt-10 font-normal font-bold leading-relaxed">
          <p className="text-6xl">
            Gitcoin
            <br />
            ID Passport
          </p>
        </div>
        <div className="font-libre-franklin md:w-1/3 mt-10 text-xl">
          Gitcoin ID Passport is an identity aggregator of the top identity providers in the web3 space into one
          transportable identity that proves your personhood.
        </div>
        <div className="mb-10 mt-10 md:w-1/4">
          <button
            data-testid="connectWalletButton"
            className="bg-gray-100 text-violet-500 rounded-lg py-4 px-20 min-w-full"
            onClick={handleConnection}
          >
            <p className="text-base">{address ? `Disconnect from ${walletLabel || ""}` : "Get Started"}</p>
          </button>
          {address ? <div className="pt-3">Connected to: {JSON.stringify(address, null, 2)}</div> : null}
        </div>
        <a className="underline">Why use your wallet as your identity?</a>
      </div>
    </div>
  );
}
