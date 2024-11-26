import React from "react";
import { vi, describe, Mock, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Confetti } from "../../components/Confetti";
import { ScorerContext, ScorerContextState } from "../../context/scorerContext";
import { useAtom } from "jotai";

// Mock the dependencies
vi.mock("react-confetti", () => ({ default: vi.fn(() => null) }));
let mockLoadingState = { loading: true };

vi.mock("jotai", () => ({
  useAtom: vi.fn(),
  atom: vi.fn(),
  useAtomValue: vi.fn(),
}));
vi.mock("../../context/userState", () => ({
  mutableUserVerificationAtom: {
    toString: () => "mocked-user-verification-atom",
    read: vi.fn(),
    write: vi.fn(),
  },
}));

describe("Confetti", () => {
  const mockSetShowConfetti = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });

    // Update the mock implementation of useAtom
    (useAtom as Mock).mockImplementation((atom) => {
      if (atom.toString() === "mocked-user-verification-atom") {
        return [mockLoadingState, vi.fn()];
      }
      return [undefined, vi.fn()];
    });
  });

  it("should render null when showConfetti is false", () => {
    (useAtom as Mock).mockReturnValue([{ loading: false }]);
    render(
      <ScorerContext.Provider value={{ rawScore: 0, threshold: 100 } as unknown as ScorerContextState}>
        <Confetti />
      </ScorerContext.Provider>
    );
    expect(screen.queryByTestId("react-confetti")).not.toBeInTheDocument();
  });

  it("should render ReactConfetti with a canvas element when showConfetti is true", () => {
    (useAtom as Mock).mockReturnValue([{ loading: false }]);
    vi.spyOn(React, "useState").mockImplementation(() => [true, mockSetShowConfetti]);
    render(
      <ScorerContext.Provider value={{ rawScore: 150, threshold: 100 } as unknown as ScorerContextState}>
        <Confetti />
      </ScorerContext.Provider>
    );
    expect(screen.getByTestId("react-confetti")).toBeInTheDocument();
  });
});
