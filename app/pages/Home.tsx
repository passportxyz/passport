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
    <div className="font-miriam-libre min-h-max min-h-default bg-purple-darkpurple bg-no-repeat text-gray-100 md:bg-center">
      <div className="container mx-auto flex flex-row flex-wrap items-center p-5">
        <img src="/assets/gitcoinLogoWhite.svg" alt="Gitcoin Logo" />
        <img className="ml-6 mr-6" src="/assets/logoLine.svg" alt="Logo Line" />
        <img src="/assets/passportLogoWhite.svg" alt="pPassport Logo" />
      </div>
      <div className="container mx-auto px-5 py-2">
        <div className="mx-auto flex flex-wrap">
          <div className="mt-0 w-full pb-6 text-white sm:mt-40 sm:w-1/2 md:mt-40 md:w-1/2 md:pt-6">
            <div className="font-miriam-libre leading-relaxed">
              <img src="/assets/gitcoinWordLogo.svg" alt="pPassport Logo" className="py-4" />
              <p className="text-5xl sm:text-7xl md:text-7xl">Passport</p>
            </div>
            <div className="font-libre-franklin mt-0 text-lg text-gray-400 sm:text-xl md:mt-10 md:pr-20 md:text-xl">
              Take control of your online identity by creating a decentralized record of your credentials. By 
              collecting "stamps" of validation for your identity and online reputation, you can gain access to 
              the most trustworthy web3 experiences and maximize your ability to benefit from platforms like 
              Gitcoin Grants. The more you verify your identity, the more opportunities you will have to vote 
              and participate across the web3.
            </div>
            <div className="mt-4 hidden w-full sm:mt-10 sm:w-1/2 md:mt-10 md:block md:w-1/2">
              <button
                data-testid="connectWalletButton"
                className="rounded-sm rounded bg-purple-connectPurple px-10 py-2 text-white"
                onClick={handleConnection}
              >
                <p className="text-base">{address ? `Disconnect from ${walletLabel || ""}` : "Connect Wallet"}</p>
              </button>
            </div>
          </div>
          {/* Stamp Provider Tile Display */}
          <div className="mx-auto mb-10 text-gray-600 sm:mt-20 sm:w-1/2 sm:py-20 md:bg-none md:py-20">
            <div className="-m-4 flex flex-wrap">
              <div className="m-2 rounded md:px-6">
                <img
                  src={"./assets/passportLanding.svg"}
                  alt={"Stamp Logo Tiles"}
                  className="m-auto mt-4 w-4/5 md:-mt-4 md:-mb-72 md:w-full md:p-2 lg:-mt-24 lg:-mb-72 xl:-mt-44"
                />
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
