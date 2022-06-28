// --- React Methods
import React from "react";

import { PROVIDER_ID } from "@gitcoin/passport-types";

export type CustomToastProps = {
  providerId: PROVIDER_ID;
  result: any;
};

// This content overrides Chakra UI Toast style in render function
export const DoneToastContent = ({ providerId, result }: CustomToastProps): JSX.Element => {
  return (
    <div
      className="rounded-md bg-blue-darkblue text-white"
      data-testid={`toast-done-${providerId && providerId.toLowerCase()}`}
    >
      <div className="flex p-4">
        <div className="mr-2">
          <button className="cursor-not-allowed rounded-full bg-gray-100">
            <img alt="information circle" className="sticky top-0" src="./assets/check-icon.svg" />
          </button>
        </div>
        <div className="flex-grow">
          <h2 className="title-font mb-2 text-lg font-bold">Done!</h2>
          <p>Your {providerId} stamp has been verified.</p>
        </div>
        <div>
          <button className="sticky top-0" onClick={result.onClose}>
            <img alt="close button" className="rounded-lg hover:bg-gray-500" src="./assets/x-icon.svg" />
          </button>
        </div>
      </div>
    </div>
  );
};
