// --- React Methods
import React from "react";

// --- Identity Providers
import { GoogleCard, SimpleCard, EnsCard, TwitterCard } from "./ProviderCards";

export const CardList = (): JSX.Element => {
  return (
    <section className="body-font text-gray-600">
      <div className="container mx-auto px-5 py-24">
        <div className="-m-4 flex flex-wrap">
          <SimpleCard />
          <GoogleCard />
          <EnsCard />
          <TwitterCard />
        </div>
      </div>
    </section>
  );
};
