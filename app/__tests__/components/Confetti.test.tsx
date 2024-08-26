import React from "react";
import { render, screen } from "@testing-library/react";
import { Confetti } from "../../components/Confetti";
import { ScorerContext, ScorerContextState } from "../../context/scorerContext";
import { mutableUserVerificationAtom } from "../../context/userState";
import { useAtom } from "jotai";

// Mock the dependencies
jest.mock("react-confetti", () => jest.fn(() => null));
let mockLoadingState = { loading: true };

jest.mock("jotai", () => ({
  useAtom: jest.fn(),
  atom: jest.fn(),
  useAtomValue: jest.fn(),
}));
jest.mock("../../context/userState", () => ({
  mutableUserVerificationAtom: {
    toString: () => "mocked-user-verification-atom",
    read: jest.fn(),
    write: jest.fn(),
  },
}));

describe("Confetti", () => {
  const mockSetShowConfetti = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1024 });

    // Update the mock implementation of useAtom
    (useAtom as jest.Mock).mockImplementation((atom) => {
      if (atom.toString() === "mocked-user-verification-atom") {
        return [mockLoadingState, jest.fn()];
      }
      return [undefined, jest.fn()];
    });
  });

  it("should render null when showConfetti is false", () => {
    (useAtom as jest.Mock).mockReturnValue([{ loading: false }]);
    const { container } = render(
      <ScorerContext.Provider value={{ rawScore: 0, threshold: 100 } as unknown as ScorerContextState}>
        <Confetti />
      </ScorerContext.Provider>
    );
    expect(screen.queryByTestId("react-confetti")).not.toBeInTheDocument();
  });

  it("should render ReactConfetti with a canvas element when showConfetti is true", () => {
    (useAtom as jest.Mock).mockReturnValue([{ loading: false }]);
    jest.spyOn(React, "useState").mockImplementation(() => [true, mockSetShowConfetti]);
    const { container } = render(
      <ScorerContext.Provider value={{ rawScore: 150, threshold: 100 } as unknown as ScorerContextState}>
        <Confetti />
      </ScorerContext.Provider>
    );
    expect(screen.getByTestId("react-confetti")).toBeInTheDocument();
  });
});
