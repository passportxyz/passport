import React from "react";
import { ScorerContext } from "../../context/scorerContext";

export const getOnboardingMock = (): "nice" | "boost" | null => {
  const hash = typeof window !== "undefined" ? window.location.hash : "";
  const qIndex = hash.indexOf("?");
  if (qIndex === -1) return null;
  const value = new URLSearchParams(hash.slice(qIndex + 1)).get("mock");
  return value === "nice" || value === "boost" ? value : null;
};

export const useOnboardingScore = (): {
  rawScore: number;
  threshold: number;
  loading: boolean;
} => {
  const { rawScore, threshold, scoreState } = React.useContext(ScorerContext);
  const mock = getOnboardingMock();
  if (mock === "nice") return { rawScore: 23, threshold: 20, loading: false };
  if (mock === "boost") return { rawScore: 5, threshold: 20, loading: false };
  return {
    rawScore,
    threshold,
    loading: scoreState.status === "loading" || scoreState.status === "initial",
  };
};
