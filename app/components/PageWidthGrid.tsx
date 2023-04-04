import React from "react";

export const PAGE_PADDING = "px-4 md:px-10 lg:px-20";
export const CONTENT_MAX_WIDTH_INCLUDING_PADDING = "max-w-[1440px]";

const PageWidthGrid = ({
  children,
  className,
  nested,
}: {
  children: React.ReactNode;
  className?: string;
  nested?: boolean;
}) => (
  <div
    className={`col-span-full grid w-full grid-cols-4 gap-4 justify-self-center md:grid-cols-6 md:gap-6 lg:grid-cols-8 xl:grid-cols-12 ${className} ${
      nested ? "" : PAGE_PADDING + " " + CONTENT_MAX_WIDTH_INCLUDING_PADDING
    }`}
  >
    {children}
  </div>
);

export default PageWidthGrid;
