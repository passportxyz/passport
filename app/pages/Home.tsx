/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */
// --- React Methods
import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

// --- Shared data context
import { UserContext } from "../context/userContext";

// --- Components
import { Footer } from "../components/Footer";

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
            <div className="font-miriam-libre leading-relaxed">
              <img src="/assets/gitcoinWordLogo.svg" alt="pPassport Logo" className="py-4" />
              <p className="text-5xl sm:text-7xl md:text-7xl">Passport</p>
            </div>
            <div className="font-mariam-libre  mt-0 pr-20 text-lg text-gray-500 sm:text-xl md:mt-10 md:text-xl">
              Grow a decentralized identity record with various credentials about you. Through the network of sources
              about your personhood, applications like Gitcoin Grants 2.0 gives you rights like matching weight in
              Quadratic Funding.
            </div>
            <div className="mt-4 w-full sm:mt-10 sm:w-1/2 md:mt-10 md:w-1/2">
              <button
                data-testid="connectWalletButton"
                className="invisible rounded-sm rounded bg-purple-connectPurple px-10 py-2 text-white md:visible"
                onClick={handleConnection}
              >
                <p className="text-base">{address ? `Disconnect from ${walletLabel || ""}` : "Connect Wallet"}</p>
              </button>
            </div>
          </div>
          {/* Stamp Provider Tile Display */}
          <div className="mx-auto mt-20 bg-mobileLandingPageBackground text-gray-600 sm:mt-20 sm:w-1/2 sm:py-20 md:mt-16 md:bg-none md:py-24">
            <div className="-m-4 flex flex-wrap">
              <div className="m-2 rounded px-6">
                <img src={"./assets/logoTiles.svg"} alt={"Stamp Logo Tiles"} className="p-2" />
              </div>
            </div>
          </div>
          {/* Connect Button on Mobile View */}
          <button
            data-testid="connectWalletButtonMobile"
            className="w-full rounded-sm rounded bg-purple-connectPurple py-2 px-10 text-white md:invisible"
            onClick={handleConnection}
          >
            <p className="text-base">{address ? `Disconnect from ${walletLabel || ""}` : "Connect Wallet"}</p>
          </button>
        </div>
      </div>
      {/* This footer contains light colored text and light images */}
      <Footer lightMode={true} />
    </div>
  );
}
