import React from "react";
import { DrawerFooterProps } from "../types";

export const DrawerFooter = ({ onUpdateScore }: DrawerFooterProps) => {
  return (
    <div className="border-t border-foreground-6 p-4 md:p-6 bg-background">
      <button
        onClick={onUpdateScore}
        className="w-full px-8 py-3 bg-foreground-2 text-background-4 font-semibold rounded-full hover:bg-foreground-3 transition-colors"
      >
        Update Score
      </button>
    </div>
  );
};
