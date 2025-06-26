import React from "react";

export const PAGE_PADDING = "px-0 md:px-10 lg:px-20";
export const CONTENT_MAX_WIDTH_INCLUDING_PADDING = "max-w-[1440px]";
export const CONTENT_MAX_WIDTH = "max-w-screen-xl";

const PageWidthGrid = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`col-span-full grid w-full grid-cols-4 gap-4 justify-self-center
      md:grid-cols-6 md:gap-6 lg:grid-cols-8 xl:grid-cols-12 ${className || ""}`}
  >
    {children}
  </div>
);

export default PageWidthGrid;
