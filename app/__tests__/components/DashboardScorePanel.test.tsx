import React from "react";
import { screen } from "@testing-library/react";
import { DashboardScorePanel } from "../../components/DashboardScorePanel";

import { renderWithContext, makeTestCeramicContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

jest.mock("../../context/userState", () => ({
  mutableUserVerificationAtom: {
    toString: () => "mocked-user-verification-atom",
    read: jest.fn(),
    write: jest.fn(),
  },
}));

let mockLoadingState = { loading: true };

jest.mock("jotai", () => ({
  useAtom: jest.fn().mockImplementation((atom) => {
    if (atom.toString() === "mocked-user-verification-atom") {
      return [mockLoadingState, jest.fn()];
    }
    return [undefined, jest.fn()];
  }),
  atom: jest.fn(),
  useAtomValue: jest.fn(),
}));

jest.mock("../../hooks/useCustomization", () => ({
  useCustomization: jest.fn(),
}));

jest.mock("../../utils/customizationUtils", () => ({
  isDynamicCustomization: jest.fn(),
}));

describe("DashboardScorePanel", () => {
  it("should indicate the loading state", () => {
    renderWithContext(mockCeramicContext, <DashboardScorePanel className="test" />);
    expect(screen.getByText("Updating")).toBeInTheDocument();
  });

  it("should handle when not loading", () => {
    // Set the loading state to false for this test
    mockLoadingState = { loading: false };
    renderWithContext(mockCeramicContext, <DashboardScorePanel className="test" />);
    // Check for some other text or element that indicates it is not in loading state
    expect(screen.getByText("0")).toBeInTheDocument(); // Adjust this based on your actual UI
  });
});
