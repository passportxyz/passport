/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */
// --- React Methods
import React, { useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

// --- Shared data context
import { UserContext } from "../context/userContext";

// --- Components
import MinimalHeader from "../components/MinimalHeader";
import PageWidthGrid, { PAGE_PADDING } from "../components/PageWidthGrid";
import HeaderContentFooterGrid from "../components/HeaderContentFooterGrid";
import SIWEButton from "../components/SIWEButton";

const Footer = () => (
  <>
    <div className="h-20 lg:hidden" />
    <div className="landingPageFooter hidden h-[360px] lg:block" />
  </>
);

export default function Home() {
  const { toggleConnection, wallet } = useContext(UserContext);

  const navigate = useNavigate();

  // Route user to dashboard when wallet is connected
  useEffect(() => {
    if (wallet) {
      navigate("/dashboard");
    }
  }, [wallet]);

  // // Route user to Welcome page when wallet is connected
  // useEffect(() => {
  //   if (wallet) {
  //     navigate("/welcome");
  //   }
  // }, [wallet]);

  return (
    <div className="bg-background text-color-2 tall:max-h-screen tall:overflow-hidden">
      <HeaderContentFooterGrid>
        <div className={PAGE_PADDING}>
          <MinimalHeader className={`border-b border-accent-2`} />
        </div>
        <PageWidthGrid className="mt-8 items-center">
          <div className="col-span-4 flex flex-col items-center text-center md:col-start-2 lg:col-start-3 xl:col-span-6 xl:col-start-4">
            <img src="/assets/gitcoinLogoType.svg" alt="Gitcoin Logo" />
            <img src="/assets/passportLandingPageLogo.svg" alt="Passport Logo" className="pt-6" />
            <div className="py-4 font-heading text-2xl text-color-3">Take control of your identity.</div>
            <div className="text-base">
              By collecting &ldquo;stamps&rdquo; of validation for your identity and online reputation, you can gain
              access to the most trustworthy web3 experiences and maximize your ability to benefit from platforms like
              Gitcoin Grants. The more you verify your identity, the more opportunities you will have to vote and
              participate across the web3.
            </div>
            <SIWEButton testId="connectWalletButton" login={toggleConnection} className="mt-4 md:mt-10" />
          </div>
        </PageWidthGrid>
        <Footer />
      </HeaderContentFooterGrid>
    </div>
  );
}
