import React from "react";
import { useResetWalletConnection } from "../hooks/useResetWalletConnection";

const PageRoot = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  useResetWalletConnection();

  return <div className={`bg-background font-body ${className}`}>{children}</div>;
};

export default PageRoot;
