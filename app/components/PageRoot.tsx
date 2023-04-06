import React from "react";

const BACKGROUND_TEXTURE = "bg-[url('/assets/backgroundTexture.svg')] bg-[top_-500px_center] bg-repeat-y";

const PageRoot = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-background font-body ${BACKGROUND_TEXTURE} ${className}`}>{children}</div>
);

export default PageRoot;
