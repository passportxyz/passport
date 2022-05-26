// --- React Methods
import React from "react";

// --- Identity Providers
import { GoogleCard, EnsCard, PohCard, TwitterCard, PoapCard, FacebookCard } from "./ProviderCards";

export const CardList = (): JSX.Element => {
  return (
    <div className="container mx-auto py-10">
      <div className="-m-4 flex flex-wrap">
        <GoogleCard />
        <EnsCard />
        <TwitterCard />
        <PohCard />
        <PoapCard />
        <FacebookCard />
      </div>
    </div>
  );
};
