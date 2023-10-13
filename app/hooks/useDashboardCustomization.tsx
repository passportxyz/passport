import React from "react";
import { VeraxPanel } from "../components/VeraxPanel";

export const useDashboardCustomization = (customizationKey?: string) => {
  let usingCustomPanel = true;
  let CustomPanel = ({ className }: { className: string }) => <div></div>;

  switch (customizationKey) {
    case "verax":
      CustomPanel = VeraxPanel;
      break;
    default:
      usingCustomPanel = false;
      break;
  }

  return { usingCustomPanel, CustomPanel };
};
