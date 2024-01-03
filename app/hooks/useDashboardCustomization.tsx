import React from "react";
import { VeraxPanel } from "../components/VeraxPanel";
import { TestingPanel } from "../components/TestingPanel";

export const useDashboardCustomization = (customizationKey?: string) => {
  let usingCustomPanel = true;
  let CustomPanel = ({ className }: { className: string }) => <div></div>;

  switch (customizationKey) {
    case "testing":
      CustomPanel = TestingPanel;
      break;
    case "verax":
      CustomPanel = VeraxPanel;
      break;
    default:
      usingCustomPanel = false;
      break;
  }

  return { usingCustomPanel, CustomPanel };
};
