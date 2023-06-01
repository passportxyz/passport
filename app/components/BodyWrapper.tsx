import React from "react";
import { PAGE_PADDING, CONTENT_MAX_WIDTH_INCLUDING_PADDING } from "./PageWidthGrid";

const BodyWrapper = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`${PAGE_PADDING} ${CONTENT_MAX_WIDTH_INCLUDING_PADDING} justify-self-center overflow-x-hidden ${className}`}
  >
    {children}
  </div>
);

export default BodyWrapper;
