/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */
// --- React Methods
import React, { useEffect, useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

// --- Shared data context
import { UserContext } from "../context/userContext";

export default function Home() {
  const { handleConnection, address, walletLabel, wallet } = useContext(UserContext);

  const navigate = useNavigate();

  // Route user to dashboard when wallet is connected
  useEffect(() => {
    if (wallet) {
      navigate("/dashboard");
    }
  }, [wallet]);

  return (
    <div className="font-miriam-libre min-h-max min-h-default bg-landingPageBackground bg-cover bg-no-repeat text-gray-100">
      <div className="container mx-auto flex flex-row flex-wrap items-center p-5">
        <img src="/assets/gitcoinLogoWhite.svg" alt="Gitcoin Logo" />
        <img className="ml-6 mr-6" src="/assets/logoLine.svg" alt="Logo Line" />
        <img src="/assets/passportLogoWhite.svg" alt="pPassport Logo" />
      </div>
      <div className="container mx-auto px-5 py-2">
        <div className="mx-auto flex flex-wrap">
          <div className="mt-0 w-full py-6 text-white sm:mt-40 sm:w-1/2 md:mt-40 md:w-1/2">
            <div className="font-miriam-libre mt-10 leading-relaxed">
              <p className="text-5xl sm:text-7xl md:text-7xl">Passport</p>
            </div>
            <div className="px-2 text-gray-600 sm:hidden sm:w-1/2 md:hidden">
              <div className="-m-4 flex flex-wrap p-10">
                <img src={"./assets/logoTiles.svg"} alt={"Stamp Logo Tiles"} />
              </div>
            </div>
            <div className="font-mariam-libre  mt-0 pr-20 text-lg text-gray-500 sm:text-xl md:mt-10 md:text-xl">
              Grow a decentralized identity record with various credentials about you. Through the network of sources
              about your personhood, applications like Gitcoin Grants 2.0 gives you rights like matching weight in
              Quadratic Funding.
            </div>
            <div className="mt-4 w-full sm:mt-10 sm:w-1/2 md:mt-10 md:w-1/2">
              <button
                data-testid="connectWalletButton"
                className="rounded-sm rounded bg-purple-connectPurple py-2 px-10 text-white"
                onClick={handleConnection}
              >
                <p className="text-base">{address ? `Disconnect from ${walletLabel || ""}` : "Connect Wallet"}</p>
              </button>
              {address ? <div className="pt-3">Connected to: {JSON.stringify(address, null, 2)}</div> : null}
            </div>
          </div>
          {/* Stamp Provider Tile Display */}
          <div className="container mx-auto mt-2 px-5 py-2 text-gray-600 sm:mt-20 sm:w-1/2 sm:py-20 md:mt-16 md:py-24">
            <div className="-m-4 flex flex-wrap">
              <div className="m-2 rounded px-6 py-8">
                <img src={"./assets/logoTiles.svg"} alt={"Stamp Logo Tiles"} className="p-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="container mx-auto flex flex-col flex-wrap items-center py-5 px-2 md:flex-row">
        <div className="flex flex-wrap p-2 text-base">
          Powered By
          <a href="https://ceramic.network/" target="_blank" rel="noopener noreferrer" className="ml-2 underline">
            Ceramic Network.
          </a>
        </div>
        <img
          src="./assets/GitcoindaoLogoDark.svg"
          alt="Gitcoin Logo Dark"
          className="flex flex-wrap items-center justify-center p-2 text-base md:ml-auto md:mr-auto"
        />
        <a
          href="https://github.com/gitcoinco/dPopp"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex rounded py-1 px-20 text-base md:mt-0"
        >
          <img src="./assets/githubLogo.svg" alt="Github Logo" />
        </a>
        <a
          href="https://docs.passport.gitcoin.co/"
          target="_blank"
          rel="noopener noreferrer"
          className="border-grey-200 ml-2 mt-4 inline-flex items-center rounded-full rounded border-2 py-1 px-4 text-base md:mt-0"
        >
          FAQ
        </a>
      </div>
    </div>
  );
}
