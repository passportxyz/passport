/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */
// --- React Methods
import React from "react";

// --- Components
import PageRoot from "../components/PageRoot";
import MinimalHeader from "../components/MinimalHeader";
import PageWidthGrid, { PAGE_PADDING } from "../components/PageWidthGrid";
import HeaderContentFooterGrid from "../components/HeaderContentFooterGrid";
import BodyWrapper from "../components/BodyWrapper";

const Footer = () => (
  <>
    <div className="h-20 lg:hidden" />
    <div className="bg-contain bg-top hidden h-[360px] bg-[url(/assets/backgroundRock.png)] bg-no-repeat lg:block" />
  </>
);

export default function Maintenance() {
  return (
    <PageRoot className="text-color-2" useLegacyBackground={true}>
      <HeaderContentFooterGrid>
        <div className={`${PAGE_PADDING} bg-background`}>
          <MinimalHeader className={`border-b border-accent-2`} />
        </div>
        <BodyWrapper className="mt-8 self-center">
          <PageWidthGrid>
            <div className="col-span-4 flex flex-col items-center text-center md:col-start-2 lg:col-start-3 xl:col-span-6 xl:col-start-4">
              <img src="/assets/gitcoinLogoType.svg" alt="Gitcoin Logo" />
              <img src="/assets/passportLandingPageLogo.svg" alt="Passport Logo" className="pt-6" />
              <div className="py-4 font-heading text-2xl text-color-3">Sorry, we&#39;re down for maintenance.</div>
              <div className="text-base">
                Gitcoin Passport is currently down for scheduled maintenance. Please check back again as we will be back
                up shortly. For more information, check{" "}
                <a
                  className="text-accent-3 hover:underline"
                  href="https://twitter.com/gitcoinpassport"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  @GitcoinPassport
                </a>{" "}
                for updates.
              </div>
            </div>
          </PageWidthGrid>
        </BodyWrapper>
        <Footer />
      </HeaderContentFooterGrid>
    </PageRoot>
  );
}
