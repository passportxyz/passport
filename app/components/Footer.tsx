// --- React Methods
import React from "react";

export type FooterProps = {
  lightMode?: boolean;
};

export const Footer = ({ lightMode }: FooterProps): JSX.Element => {
  return (
    <div className="flex h-[120px] items-center justify-between px-4 text-base md:px-12">
      <div className="text-purple-softpurple">
        Available on
        <a
          href="https://ceramic.network/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 text-purple-darkpurple hover:underline lg:ml-2"
        >
          Ceramic
        </a>
      </div>
      <div className="flex items-center">
        <a
          href={`https://github.com/gitcoinco/passport/commit/${process.env.NEXT_PUBLIC_GIT_COMMIT_HASH}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mr-8 text-purple-darkpurple"
        >
          Git commit
        </a>
        <a href="https://github.com/gitcoinco/passport" target="_blank" rel="noopener noreferrer" className="mr-8">
          <img src={lightMode ? "./assets/githubLogoLight.svg" : "./assets/githubLogoDark.svg"} alt="Github Logo" />
        </a>
        <a
          href="https://docs.passport.gitcoin.co/gitcoin-passport-sdk/getting-started"
          target="_blank"
          rel="noopener noreferrer"
          className=""
        >
          <img src={lightMode ? "./assets/docsIconLight.svg" : "./assets/docsIconDark.svg"} alt="Docs Icon" />
        </a>
      </div>
    </div>
  );
};
