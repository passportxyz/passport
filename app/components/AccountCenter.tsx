// --- React components/methods
import React from "react";
import { useOneClickVerification } from "../hooks/useOneClickVerification";
import { CustomAccountWidget } from "./CustomAccountWidget";

export const AccountCenter = () => {
  const { verificationComplete } = useOneClickVerification();

  return (
    <div
      className={`rounded-2xl w-fit h-fit bg-background flex justify-end ${verificationComplete ? "right-14 md:right-20 lg:right-36" : "right-2 md:right-10 lg:right-20"}`}
    >
      <CustomAccountWidget />
    </div>
  );
};
