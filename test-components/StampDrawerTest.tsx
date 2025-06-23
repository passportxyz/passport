import React, { useState } from "react";
import { ethereumMockData, allStatesTestData } from "./mockData/variant1Data";
import { cleanHandsMockData, cleanHandsVerifiedMockData } from "./mockData/variant2Data";

// Import the variant components we'll create
import { MultiCredentialView } from "./MultiCredentialView";
import { GuidedFlowView } from "./GuidedFlowView";

// Test scenarios for easy switching
const testScenarios = {
  "ethereum-verified": ethereumMockData,
  "all-states": allStatesTestData,
  "clean-hands": cleanHandsMockData,
  "clean-hands-verified": cleanHandsVerifiedMockData,
};

export const StampDrawerTest: React.FC = () => {
  const [currentScenario, setCurrentScenario] = useState<keyof typeof testScenarios>("ethereum-verified");
  const [isOpen, setIsOpen] = useState(true);

  const currentData = testScenarios[currentScenario];

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setIsOpen(true), 300); // Reopen after animation
  };

  const handleVerify = () => {
    console.log("Verify clicked");
    alert("Verify button clicked - in real app this would start verification");
  };

  const handleUpdateScore = () => {
    console.log("Update Score clicked");
    alert("Update Score clicked - in real app this would update the score");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Test Controls */}
      <div className="fixed top-4 left-4 z-50 bg-background-2 p-4 rounded-lg shadow-lg">
        <h3 className="text-color-1 font-semibold mb-2">Test Controls</h3>
        <select
          value={currentScenario}
          onChange={(e) => setCurrentScenario(e.target.value as keyof typeof testScenarios)}
          className="w-full p-2 rounded bg-background text-color-4 border border-foreground-3"
        >
          <option value="ethereum-verified">Ethereum (Variant 1 - Verified)</option>
          <option value="all-states">All Credential States (Variant 1)</option>
          <option value="clean-hands">Clean Hands (Variant 2 - Not Verified)</option>
          <option value="clean-hands-verified">Clean Hands (Variant 2 - Verified)</option>
        </select>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="mt-2 w-full p-2 bg-foreground-2 text-color-4 rounded hover:bg-foreground-3"
        >
          {isOpen ? "Close" : "Open"} Drawer
        </button>
      </div>

      {/* Drawer Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={handleClose} />}

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full bg-background shadow-xl z-50 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width: "480px", maxWidth: "100vw" }}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-color-9 hover:text-color-1 z-10"
          aria-label="Close drawer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Drawer Content */}
        <div className="h-full overflow-y-auto">
          {currentData.variant === 1 ? (
            <MultiCredentialView
              data={currentData}
              onVerify={handleVerify}
              onUpdateScore={handleUpdateScore}
              onClose={handleClose}
            />
          ) : (
            <GuidedFlowView
              data={currentData}
              onVerify={handleVerify}
              onUpdateScore={handleUpdateScore}
              onClose={handleClose}
            />
          )}
        </div>
      </div>
    </div>
  );
};
