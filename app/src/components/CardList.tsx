// --- React Methods
import React from "react";

// --- Identity Providers
import { GoogleCard, SimpleCard } from "./providerCards";

export const CardList = (): JSX.Element => {
  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-24 mx-auto">
        <div className="flex flex-wrap -m-4">
          <SimpleCard />
          <GoogleCard />
        </div>
      </div>
    </section>
  );
};
