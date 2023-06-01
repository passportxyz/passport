// --- React Methods
import React from "react";
import PageWidthGrid, { PAGE_PADDING } from "../components/PageWidthGrid";

export type FooterProps = {
  lightMode?: boolean;
};

export const Footer = ({ lightMode }: FooterProps): JSX.Element => {
  return (
    <PageWidthGrid className={`grid-flow-dense py-8 font-alt text-color-1 lg:flex ${PAGE_PADDING}`}>
      <div className="col-span-3 grow md:col-span-4">
        <span className="text-color-3">Available on </span>
        <a href="https://ceramic.network/" target="_blank" rel="noopener noreferrer" className="hover:underline">
          Ceramic.
        </a>
      </div>
      <a
        href="https://support.gitcoin.co/gitcoin-knowledge-base/gitcoin-passport/what-is-gitcoin-passport"
        target="_blank"
        rel="noopener noreferrer"
        className="col-span-4 hover:underline"
      >
        Learn More
      </a>
      <a
        href="https://scorer.gitcoin.co/"
        target="_blank"
        rel="noopener noreferrer"
        className="col-span-4 hover:underline"
      >
        Gitcoin Passport Scorer
      </a>
      <a
        href={`https://github.com/gitcoinco/passport/commit/${process.env.NEXT_PUBLIC_GIT_COMMIT_HASH}`}
        target="_blank"
        rel="noopener noreferrer"
        className="col-span-4 hover:underline"
      >
        Git commit
      </a>
      <div className="col-start-[-2] col-end-[-1] flex items-center justify-self-end md:col-start-[-3]">
        <a href="https://github.com/gitcoinco/passport" target="_blank" rel="noopener noreferrer" className="mr-8">
          <img src={lightMode ? "./assets/githubLogoLight.svg" : "./assets/githubLogoDark.svg"} alt="Github Logo" />
        </a>
        <a href="https://docs.passport.gitcoin.co" target="_blank" rel="noopener noreferrer">
          <img src={lightMode ? "./assets/docsIconLight.svg" : "./assets/docsIconDark.svg"} alt="Docs Icon" />
        </a>
      </div>
    </PageWidthGrid>
  );
};
