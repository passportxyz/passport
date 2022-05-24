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
    <div className="font-miriam-libre min-h-max min-h-default bg-purple-darkpurple text-gray-100">
      <div className="container mx-auto px-5 py-2">
        <div className="mx-auto flex flex-wrap">
          <div className="w-full py-6 text-white sm:w-1/2 md:w-1/2">
            <img src="/assets/GitcoinLogoAndName.svg" alt="logo" className="mt-0 sm:mt-40 md:mt-40" />
            <div className="font-miriam-libre mt-10 leading-relaxed">
              <p className="text-5xl sm:text-7xl md:text-7xl">dPassport</p>
            </div>
            <div className="font-miriam-libre mt-2 text-lg sm:mt-10 sm:text-xl md:mt-10 md:text-xl">
              A scored decentralized proof of personhood passport.
            </div>
            <div className="px-2 text-gray-600 sm:hidden sm:w-1/2 md:hidden">
              <div className="-m-4 flex flex-wrap p-10">
                <img src={"./assets/logoTiles.svg"} alt={"Stamp Logo Tiles"} />
              </div>
            </div>
            <div className="font-mariam-libre  mt-0 text-sm sm:text-base md:mt-10 md:w-1/2 md:text-base">
              dPassport lets you grow a decentralized identity record with various credentials about yourself. Based on
              this network of sources about your personhood and who you are, social institutions like Gitcoin Grants can
              give you rights like matching weight in Quadratic Funding.
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
          <div className="container invisible mx-auto mt-2 px-5 py-2 text-gray-600 sm:visible sm:mt-20 sm:w-1/2 sm:py-24 md:visible md:mt-20 md:py-24">
            <div className="-m-4 flex flex-wrap">
              <div className="m-2 rounded px-6 py-8">
                <img src={"./assets/logoTiles.svg"} alt={"Stamp Logo Tiles"} className="p-2" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
