import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useOnboardingScore } from "../../../components/WalletOnboarding/mock";
import { ScorerContext, ScorerContextState } from "../../../context/scorerContext";

const setHash = (h: string) => {
  window.location.hash = h;
};

const wrapperWithValue = (value: unknown) => {
  const providerValue = value as unknown as ScorerContextState;
  return ({ children }: { children: React.ReactNode }) => (
    <ScorerContext.Provider value={providerValue}>{children}</ScorerContext.Provider>
  );
};

describe("useOnboardingScore", () => {
  afterEach(() => setHash(""));

  it("returns the 'nice' mock override regardless of provider values", () => {
    setHash("#/wallet-onboarding?mock=nice");

    const { result } = renderHook(() => useOnboardingScore(), {
      wrapper: wrapperWithValue({
        rawScore: 1,
        threshold: 99,
        scoreState: { status: "success" },
      }),
    });

    expect(result.current).toEqual({ rawScore: 23, threshold: 20, loading: false });
  });

  it("returns the 'boost' mock override regardless of provider values", () => {
    setHash("#/wallet-onboarding?mock=boost");

    const { result } = renderHook(() => useOnboardingScore(), {
      wrapper: wrapperWithValue({
        rawScore: 1,
        threshold: 99,
        scoreState: { status: "success" },
      }),
    });

    expect(result.current).toEqual({ rawScore: 5, threshold: 20, loading: false });
  });

  it("falls back to context values with loading false on success", () => {
    setHash("");

    const { result } = renderHook(() => useOnboardingScore(), {
      wrapper: wrapperWithValue({
        rawScore: 12,
        threshold: 20,
        scoreState: { status: "success" },
      }),
    });

    expect(result.current).toEqual({ rawScore: 12, threshold: 20, loading: false });
  });

  it("reports loading true when scoreState status is 'loading'", () => {
    setHash("");

    const { result } = renderHook(() => useOnboardingScore(), {
      wrapper: wrapperWithValue({
        rawScore: 12,
        threshold: 20,
        scoreState: { status: "loading" },
      }),
    });

    expect(result.current.loading).toBe(true);
  });

  it("reports loading true when scoreState status is 'initial'", () => {
    setHash("");

    const { result } = renderHook(() => useOnboardingScore(), {
      wrapper: wrapperWithValue({
        rawScore: 12,
        threshold: 20,
        scoreState: { status: "initial" },
      }),
    });

    expect(result.current.loading).toBe(true);
  });
});
