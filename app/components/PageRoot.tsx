import React from "react";
import { Chatbot } from "../components/Chatbot";

const PageRoot = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <>
    <div className={`bg-background font-body ${className}`}>{children}</div>
    <Chatbot />
  </>
);

export default PageRoot;
