import React from "react";
import { DrawerHeaderProps } from "../types";

export const DrawerHeader = ({ icon, name, onClose }: DrawerHeaderProps) => {
  return (
    <div className="flex items-center justify-between p-4 md:p-6 border-b border-foreground-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center">{icon}</div>
        <h2 className="text-lg font-semibold text-color-1">{name}</h2>
      </div>
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-full bg-background-2 text-color-1 flex items-center justify-center hover:bg-foreground-6 transition-colors"
        aria-label="Close drawer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
