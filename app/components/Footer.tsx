// --- React Methods
import React from "react";
import PageWidthGrid from "../components/PageWidthGrid";

export type FooterProps = {
  lightMode?: boolean;
};

export const Footer = ({ lightMode }: FooterProps): JSX.Element => {
  return (
    <PageWidthGrid className="grid-flow-dense py-8 text-color-1 lg:flex" unconstrainedWidth>
      <div className="col-span-3 grow md:col-span-4">
        <span className="text-color-3">Available on</span>
        <a
          href="https://ceramic.network/"
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 hover:underline lg:ml-2"
        >
          Ceramic
        </a>
      </div>
      <a href="/" target="_blank" rel="noopener noreferrer" className="col-span-2 md:col-span-3">
        Learn More
      </a>
      <a href="/" target="_blank" rel="noopener noreferrer" className="col-span-4">
        Gitcoin Passport Scorer
      </a>
      <a
        href={`https://github.com/gitcoinco/passport/commit/${process.env.NEXT_PUBLIC_GIT_COMMIT_HASH}`}
        target="_blank"
        rel="noopener noreferrer"
        className="col-span-2 justify-self-end md:col-span-3"
      >
        Git commit
      </a>
      <div className="col-start-[-2] col-end-[-1] flex items-center justify-self-end md:col-start-[-3]">
        <a href="https://github.com/gitcoinco/passport" target="_blank" rel="noopener noreferrer" className="mr-8">
          <img src={lightMode ? "./assets/githubLogoLight.svg" : "./assets/githubLogoDark.svg"} alt="Github Logo" />
        </a>
        <a
          href="https://docs.passport.gitcoin.co/gitcoin-passport-sdk/getting-started"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={lightMode ? "./assets/docsIconLight.svg" : "./assets/docsIconDark.svg"} alt="Docs Icon" />
        </a>
      </div>
    </PageWidthGrid>
  );
};
