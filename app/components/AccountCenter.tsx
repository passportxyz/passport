// --- React components/methods
import React from "react";
import { useOneClickVerification } from "../hooks/useOneClickVerification";

export const AccountCenter = () => {
  const { verificationComplete } = useOneClickVerification();

  return (
    <div
      className={`rounded-2xl w-fit h-fit bg-background lex justify-end ${verificationComplete ? "right-14 md:right-20 lg:right-36" : "right-2 md:right-10 lg:right-20"}`}
    >
      <w3m-button balance="hide" size="sm" />
    </div>
  );
};
