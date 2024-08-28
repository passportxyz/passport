/* eslint-disable react-hooks/exhaustive-deps, @next/next/no-img-element */
// --- React Methods
import React from "react";

// --- Components
import PageRoot from "./PageRoot";
import { WebmVideo } from "./WebmVideo";
import { Hyperlink } from "@gitcoin/passport-platforms";

export default function Maintenance() {
  return (
    <PageRoot className="text-color-1">
      <div className="flex h-full min-h-default items-center justify-center self-center p-8">
        <img
          className="absolute bottom-0 right-0 z-0 h-auto w-full opacity-30 gradient-mask-t-0 md:h-[110%] md:w-auto md:gradient-mask-l-0"
          src="/assets/splashPageTexture.png"
          alt=""
        />
        <div className="z-10 grid grid-flow-row grid-cols-2 gap-4 lg:grid-flow-col">
          <div className="col-span-2 text-6xl md:text-7xl lg:row-start-2">Passport</div>
          <div className="col-span-2 mb-4 text-2xl leading-none text-foreground-2 md:text-5xl">
            Unlock the best of web3
          </div>
          <WebmVideo
            src="/assets/splashPageLogo.webm"
            fallbackSrc="/assets/splashPageLogoFallback.svg"
            alt="Passport Logo"
            className="col-span-2 w-full max-w-md lg:col-start-1 lg:row-span-6 lg:mr-8 lg:max-w-2xl"
          />
          <div className="col-span-2 max-w-md text-lg lg:max-w-sm">
            Passport XYZ is currently down for scheduled maintenance. Please check back again as we will be back up
            shortly. For more information, check{" "}
            <Hyperlink href="https://twitter.com/gitcoinpassport">@GitcoinPassport</Hyperlink> for updates.
          </div>
        </div>
      </div>
    </PageRoot>
  );
}
