// --- React components/methods
import React from "react";
import { useOneClickVerification } from "../hooks/useOneClickVerification";
import { CustomAccountWidget } from "./CustomAccountWidget";

export const AccountCenter = () => {
  const { verificationComplete } = useOneClickVerification();

  return <CustomAccountWidget />;
};
