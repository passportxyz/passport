/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */
// --- React Methods
import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

// --- Shared data context
import { UserContext } from "../context/userContext";

// --- Components
import { Footer } from "../components/Footer";
import Header from "../components/Header";
import PageWidthGrid from "../components/PageWidthGrid";
import HeaderContentFooterGrid from "../components/HeaderContentFooterGrid";

const EmptyFooterSpacer = () => <div className="h-20" />;

export default function Home() {
  const { toggleConnection, address, walletLabel, wallet } = useContext(UserContext);

  const navigate = useNavigate();

  // Route user to dashboard when wallet is connected
  useEffect(() => {
    if (wallet) {
      navigate("/dashboard");
    }
  }, [wallet]);

  return (
    <div className="font-miriam-libre bg-purple-darkpurple text-gray-100">
      <HeaderContentFooterGrid>
        <Header />
        <PageWidthGrid className="items-center">
          <div className="col-span-4 flex flex-col items-center text-center text-white md:col-start-2 lg:col-start-3 xl:col-span-6 xl:col-start-4">
            <img src="/assets/gitcoinWordLogo.svg" alt="pPassport Logo" className="py-4" />
            <p className="sm:text-7xl md:text-7xl font-miriamlibre text-5xl">Passport</p>
            <div className="font-libre-franklin text-lg text-gray-400 md:text-xl">
              Take control of your online identity by creating a decentralized record of your credentials. By collecting
              &ldquo;stamps&rdquo; of validation for your identity and online reputation, you can gain access to the
              most trustworthy web3 experiences and maximize your ability to benefit from platforms like Gitcoin Grants.
              The more you verify your identity, the more opportunities you will have to vote and participate across the
              web3.
            </div>
            <div className="mt-4 w-1/2 md:mt-10">
              <button
                data-testid="connectWalletButton"
                className="rounded-sm rounded bg-purple-connectPurple px-10 py-2 text-white"
                onClick={toggleConnection}
              >
                <p className="text-base">{address ? `Disconnect from ${walletLabel || ""}` : "Connect Wallet"}</p>
              </button>
            </div>
          </div>
        </PageWidthGrid>
        <EmptyFooterSpacer />
      </HeaderContentFooterGrid>
    </div>
  );
}
