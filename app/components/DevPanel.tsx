import React, { useState, useEffect } from "react";
import scenarios from "../mocks/scenarios.json";

export const DevPanel: React.FC = () => {
  // Only show in dev mode
  if (process.env.NEXT_PUBLIC_DEV_MODE !== "true") {
    return null;
  }

  const [currentScenario, setCurrentScenario] = useState<string>(() => {
    // Get initial scenario from window or default
    if (typeof window !== "undefined") {
      return window.__mockScenario || "new-user";
    }
    return "new-user";
  });

  const [isMinimized, setIsMinimized] = useState(false);

  const loadScenario = (scenarioName: string) => {
    setCurrentScenario(scenarioName);
    // Set on window for MSW handlers to read
    window.__mockScenario = scenarioName;
    // Force reload to fetch new mock data
    window.location.reload();
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-background-2 text-color-1 px-3 py-1 rounded shadow-lg hover:bg-background-3 transition-colors"
          title="Show Dev Panel"
        >
          🔧
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-background-2 p-4 rounded-lg shadow-lg z-50 min-w-[250px]">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-color-1 font-bold">Dev Mode</h3>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-color-3 hover:text-color-1 text-sm"
          title="Minimize"
        >
          ─
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-color-3 text-xs block">Scenario:</label>
        <select
          value={currentScenario}
          onChange={(e) => loadScenario(e.target.value)}
          className="w-full px-3 py-2 bg-background text-color-1 rounded border border-foreground-6 focus:border-focus focus:outline-none"
        >
          {Object.entries(scenarios).map(([key, scenario]) => (
            <option key={key} value={key}>
              {scenario.description || key}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 pt-3 border-t border-foreground-6">
        <div className="text-xs text-color-3 space-y-1">
          <div>
            Current: <span className="text-color-2">{currentScenario}</span>
          </div>
          <div>
            Stamps:{" "}
            <span className="text-color-2">{scenarios[currentScenario as keyof typeof scenarios].stamps.length}</span>
          </div>
          <div>
            Score: <span className="text-color-2">{scenarios[currentScenario as keyof typeof scenarios].score}</span>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-color-3">
        <div className="opacity-70">💡 Change scenario to test different UI states</div>
      </div>
    </div>
  );
};
