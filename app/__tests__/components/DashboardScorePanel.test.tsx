// Added for document.getElementById since just testing invocation
/* eslint-disable testing-library/no-node-access */
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardScorePanel, OnchainCTA } from "../../components/DashboardScorePanel";
import { ScorerContext } from "../../context/scorerContext";
import { useAllOnChainStatus } from "../../hooks/useOnChainStatus";
import { PlatformScoreSpec } from "../../context/scorerContext";

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

// Add type definition for MockedFunction
type MockedFunction<T extends (...args: any[]) => any> = jest.MockedFunction<T>;

// Mock useAllOnChainStatus
jest.mock("../../hooks/useOnChainStatus", () => ({
  useAllOnChainStatus: jest.fn(),
}));

const mockedUseAllOnChainStatus = useAllOnChainStatus as MockedFunction<typeof useAllOnChainStatus>;

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

describe("OnchainCTA", () => {
  const mockSetShowSidebar = jest.fn();
  const cardListProps = {}; // Add any necessary props for CardList

  const scorerContext = {
    scoredPlatforms: [
      {
        icon: "./assets/star-light.svg",
        platform: "AllowList",
        name: "Guest List",
        description: "Verify you are part of a community",
        connectMessage: "Verify",
        isEVM: true,
        possiblePoints: 100,
        earnedPoints: 100,
      },
    ] as PlatformScoreSpec[],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders content for above threshold and all chains up to date", async () => {
    mockedUseAllOnChainStatus.mockReturnValue({ allChainsUpToDate: true });

    renderWithContext(
      mockCeramicContext,
      <OnchainCTA setShowSidebar={mockSetShowSidebar} />,
      {},
      { ...scorerContext, rawScore: 25, threshold: 20 }
    );
    expect(screen.getByText("Congratulations. Your Passport is onchain.")).toBeInTheDocument();
    expect(screen.getByText("See onchain passport")).toBeInTheDocument();
  });

  it("renders content for above threshold but chains not up to date", async () => {
    mockedUseAllOnChainStatus.mockReturnValue({ allChainsUpToDate: false });

    renderWithContext(
      mockCeramicContext,
      <OnchainCTA setShowSidebar={mockSetShowSidebar} />,
      {},
      { ...scorerContext, rawScore: 25, threshold: 20 }
    );

    expect(screen.getByText("Congratulations. You have a passing Score")).toBeInTheDocument();
    expect(screen.getByText("Mint onchain")).toBeInTheDocument();
  });

  it("renders content for below threshold", async () => {
    mockedUseAllOnChainStatus.mockReturnValue({ allChainsUpToDate: false });

    renderWithContext(
      mockCeramicContext,
      <OnchainCTA setShowSidebar={mockSetShowSidebar} />,
      {},
      { ...scorerContext, rawScore: 15, threshold: 20 }
    );

    expect(screen.getByText("Let's increase that score")).toBeInTheDocument();
    expect(screen.getByText("Verify Stamps")).toBeInTheDocument();
  });

  it("calls setShowSidebar when 'See onchain passport' button is clicked", async () => {
    mockedUseAllOnChainStatus.mockReturnValue({ allChainsUpToDate: true });

    renderWithContext(
      mockCeramicContext,
      <OnchainCTA setShowSidebar={mockSetShowSidebar} />,
      {},
      { ...scorerContext, rawScore: 25, threshold: 20 }
    );

    await userEvent.click(screen.getByText("See onchain passport"));

    await waitFor(() => {
      expect(mockSetShowSidebar).toHaveBeenCalledWith(true);
    });
  });

  it("scrolls to 'add-stamps' element when 'Verify Stamps' button is clicked", async () => {
    mockedUseAllOnChainStatus.mockReturnValue({ allChainsUpToDate: false });

    const mockScrollIntoView = jest.fn();
    document.getElementById = jest.fn().mockReturnValue({ scrollIntoView: mockScrollIntoView });

    renderWithContext(
      mockCeramicContext,
      <OnchainCTA setShowSidebar={mockSetShowSidebar} />,
      {},
      { ...scorerContext, rawScore: 15, threshold: 20 }
    );

    await userEvent.click(screen.getByText("Verify Stamps"));
    expect(document.getElementById).toHaveBeenCalledWith("add-stamps");
    expect(mockScrollIntoView).toHaveBeenCalledWith({ behavior: "smooth" });
  });
});
