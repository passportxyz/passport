// --- React Methods
import React from "react";
import { Outlet } from "react-router-dom";

export function Layout(): JSX.Element {
  return (
    <div className="bg-violet-700 font-librefranklin text-gray-100 min-h-max font-miriam-libre min-h-default">
      <div className="container px-5 py-2 mx-auto">
        <Outlet />
      </div>
    </div>
  );
}
