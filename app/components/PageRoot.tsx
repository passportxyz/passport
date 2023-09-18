import React from "react";

const PageRoot = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-background font-body ${className}`}>{children}</div>
);

export default PageRoot;
