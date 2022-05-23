// --- React Methods
import React from "react";

// --- Identity Providers
import { GoogleCard, EnsCard, PohCard, TwitterCard, PoapCard, FacebookCard, BrightidCard } from "./ProviderCards";

export const CardList = (): JSX.Element => {
  return (
    <div className="container mx-auto py-10">
      <div className="-m-4 flex flex-wrap">
        <FacebookCard />
        <GoogleCard />
        <TwitterCard />
        <BrightidCard />
        <PoapCard />
        <EnsCard />
        <PohCard />
      </div>
    </div>
  );
};
