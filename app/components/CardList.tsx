// --- React Methods
import React from "react";

// --- Identity Providers
import {
  GoogleCard,
  EnsCard,
  PohCard,
  TwitterCard,
  PoapCard,
  FacebookCard,
  BrightidCard,
  GoodDollarCard,
} from "./ProviderCards";
import GithubCard from "./ProviderCards/GithubCard";

export const CardList = (): JSX.Element => {
  return (
    <div className="container mx-auto py-10">
      <div className="-m-4 flex flex-wrap">
        <FacebookCard />
        <GoogleCard />
        <TwitterCard />
        <GithubCard />
        <BrightidCard />
        <PoapCard />
        <EnsCard />
        <PohCard />
        <GoodDollarCard />
      </div>
    </div>
  );
};
