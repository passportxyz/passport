import React from "react";
import { useAutoVerification } from "../hooks/useAutoVerification";

export const AutoVerificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize the auto verification hook
  useAutoVerification();

  // This component doesn't render anything, it just initializes the hook
  return <>{children}</>;
};
