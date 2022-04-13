// --- React Methods
import React from "react";

// --- Identity Providers
import { Google, SimpleProvider } from "../views/providers";

export const CardList = (): JSX.Element => {
  return (
    <section className="text-gray-600 body-font">
      <div className="container px-5 py-24 mx-auto">
        <div className="flex flex-wrap -m-4">
          <SimpleProvider />
          <Google />
        </div>
      </div>
    </section>
  );
};
