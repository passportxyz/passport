// Added for document.getElementById since just testing invocation
/* eslint-disable testing-library/no-node-access */
import { vi, describe, it, expect, Mock } from "vitest";
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DashboardScorePanel, OnchainCTA } from "../../components/DashboardScorePanel";
import { useAllOnChainStatus } from "../../hooks/useOnChainStatus";
import { PlatformScoreSpec } from "../../context/scorerContext";
import { DEFAULT_CUSTOMIZATION, useCustomization } from "../../hooks/useCustomization";

import { renderWithContext, makeTestCeramicContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

vi.mock("../../context/userState", () => ({
  mutableUserVerificationAtom: {
    toString: () => "mocked-user-verification-atom",
    read: vi.fn(),
    write: vi.fn(),
  },
}));

let mockLoadingState = { loading: true };

vi.mock("jotai", () => ({
  useAtom: vi.fn().mockImplementation((atom) => {
    if (atom.toString() === "mocked-user-verification-atom") {
      return [mockLoadingState, vi.fn()];
    }
    return [undefined, vi.fn()];
  }),
  atom: vi.fn(),
  useAtomValue: vi.fn(),
}));

vi.mock("../../hooks/useCustomization", async () => {
  const actual = await vi.importActual("../../hooks/useCustomization");
  return {
    ...actual,
    useCustomization: vi.fn(),
  };
});

// Mock useAllOnChainStatus
vi.mock("../../hooks/useOnChainStatus", () => ({
  useAllOnChainStatus: vi.fn(),
}));

const mockedUseAllOnChainStatus = useAllOnChainStatus as Mock<typeof useAllOnChainStatus>;

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
  const mockSetShowSidebar = vi.fn();
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
    vi.clearAllMocks();
    vi.mocked(useCustomization).mockReturnValue({ ...DEFAULT_CUSTOMIZATION });
  });

  it("renders content for above threshold and all chains up to date", async () => {
    mockedUseAllOnChainStatus.mockReturnValue({
      allChainsUpToDate: true,
      anyChainExpired: false,
      isPending: false,
      someChainUpToDate: true,
      allAttestationProviders: [],
      onChainAttestationProviders: [],
    });

    renderWithContext(
      mockCeramicContext,
      <OnchainCTA setShowSidebar={mockSetShowSidebar} />,
      {},
      { ...scorerContext, rawScore: 25, threshold: 20 }
    );
    expect(screen.getByText("Passport minted!")).toBeInTheDocument();
    expect(screen.getByText("Open Minting Dashboard")).toBeInTheDocument();
  });

  it("renders content for above threshold but chains not up to date", async () => {
    mockedUseAllOnChainStatus.mockReturnValue({
      allChainsUpToDate: false,
      anyChainExpired: false,
      isPending: false,
      someChainUpToDate: false,
      allAttestationProviders: [],
      onChainAttestationProviders: [],
    });

    renderWithContext(
      mockCeramicContext,
      <OnchainCTA setShowSidebar={mockSetShowSidebar} />,
      {},
      { ...scorerContext, rawScore: 25, threshold: 20 }
    );

    expect(screen.getByText("Congrats! You have a passing Unique Humanity Score!")).toBeInTheDocument();
    expect(screen.getByText("Mint onchain")).toBeInTheDocument();
  });

  it("renders content for below threshold", async () => {
    mockedUseAllOnChainStatus.mockReturnValue({
      allChainsUpToDate: false,
      anyChainExpired: false,
      isPending: false,
      someChainUpToDate: false,
      allAttestationProviders: [],
      onChainAttestationProviders: [],
    });

    renderWithContext(
      mockCeramicContext,
      <OnchainCTA setShowSidebar={mockSetShowSidebar} />,
      {},
      { ...scorerContext, rawScore: 15, threshold: 20 }
    );

    expect(screen.getByText("Let's increase that Unique Humanity Score")).toBeInTheDocument();
    expect(screen.getByText("Verify Stamps")).toBeInTheDocument();
  });

  it("calls setShowSidebar when 'See onchain passport' button is clicked", async () => {
    mockedUseAllOnChainStatus.mockReturnValue({
      allChainsUpToDate: true,
      anyChainExpired: false,
      isPending: false,
      someChainUpToDate: true,
      allAttestationProviders: [],
      onChainAttestationProviders: [],
    });

    renderWithContext(
      mockCeramicContext,
      <OnchainCTA setShowSidebar={mockSetShowSidebar} />,
      {},
      { ...scorerContext, rawScore: 25, threshold: 20 }
    );

    await userEvent.click(screen.getByText("Open Minting Dashboard"));

    await waitFor(() => {
      expect(mockSetShowSidebar).toHaveBeenCalledWith(true);
    });
  });

  it("scrolls to 'add-stamps' element when 'Verify Stamps' button is clicked", async () => {
    mockedUseAllOnChainStatus.mockReturnValue({
      allChainsUpToDate: false,
      anyChainExpired: false,
      isPending: false,
      someChainUpToDate: false,
      allAttestationProviders: [],
      onChainAttestationProviders: [],
    });

    const mockScrollIntoView = vi.fn();
    document.getElementById = vi.fn().mockReturnValue({ scrollIntoView: mockScrollIntoView });

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
