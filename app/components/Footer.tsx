// --- React Methods
import React from "react";

export type FooterProps = {
  lightMode?: boolean;
};

export const Footer = ({ lightMode }: FooterProps): JSX.Element => {
  return (
    <div className="py-2 px-4">
      <div className="container mx-auto flex flex-wrap items-center py-5 px-2 md:flex-row">
        <div className="flex flex-col p-2 text-base text-gray-400 lg:flex-row">
          Powered By
          <a href="https://ceramic.network/" target="_blank" rel="noopener noreferrer" className="underline lg:ml-2">
            Ceramic Network.
          </a>
        </div>
        <a href="https://go.gitcoin.co/passport/" target="_blank">
          <img
            src="./assets/gitcoindaoLogoLight.svg"
            alt="Gitcoin Logo"
            className="flex hidden flex-wrap items-center justify-center p-2 text-base md:ml-auto md:mr-auto md:inline-block"
          />
        </a>
        <a
          href="https://github.com/gitcoinco/passport"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-auto mt-4 mr-auto inline-flex rounded py-1 text-base md:ml-12 md:mt-0 md:mr-4"
        >
          <img src={lightMode ? "./assets/githubLogoLight.svg" : "./assets/githubLogoDark.svg"} alt="Github Logo" />
        </a>
        <a
          href="https://docs.passport.gitcoin.co/gitcoin-passport-sdk/getting-started"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-2 mt-4 inline-flex items-center border-gray-400 py-2 px-6 text-base md:mt-0"
        >
          <img src={lightMode ? "./assets/docsIconLight.svg" : "./assets/docsIconDark.svg"} alt="Docs Icon" />
        </a>
      </div>
      <div className="mx-auto h-px w-full flex-grow bg-gray-400 md:invisible"></div>
      <img src="./assets/gitcoindaoLogoLight.svg" alt="Gitcoin Logo" className="mx-auto p-4 md:invisible" />
    </div>
  );
};
