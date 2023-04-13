import React from "react";

const HeaderContentFooterGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid h-full min-h-default w-full grid-cols-1 grid-rows-[auto_1fr_auto]">{children}</div>
);

export default HeaderContentFooterGrid;
