import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

const navigateToPageMock = vi.fn();
const refreshScoreMock = vi.hoisted(() => vi.fn());

let mockAccount: { address: string | undefined; connector?: { id: string } } = { address: "0xabc" };
let mockDatastore: { dbAccessToken: string | undefined; dbAccessTokenStatus: string } = {
  dbAccessToken: "tok",
  dbAccessTokenStatus: "connected",
};

vi.mock("wagmi", () => ({ useAccount: () => mockAccount }));
vi.mock("../../../context/datastoreConnectionContext", () => ({
  useDatastoreConnectionContext: () => mockDatastore,
}));
vi.mock("../../../context/scorerContext", () => ({
  ScorerContext: React.createContext({
    refreshScore: refreshScoreMock,
    rawScore: 0,
    threshold: 20,
    scoreState: { status: "success" },
  }),
}));
vi.mock("../../../hooks/useCustomization", () => ({
  useNavigateToPage: () => navigateToPageMock,
  useCustomization: () => ({ key: "none" }),
  DEFAULT_CUSTOMIZATION_KEY: "none",
}));
vi.mock("@human.tech/ui/passport", () => ({
  PassportAccess: ({
    onboardingPage,
    onPrimary,
    onSkip,
  }: {
    onboardingPage: number;
    onPrimary: () => void;
    onSkip: () => void;
  }) => (
    <div>
      <span>onboarding-page-{onboardingPage}</span>
      <button onClick={onPrimary}>onboarding-continue</button>
      <button onClick={onSkip}>onboarding-skip</button>
    </div>
  ),
  ScoreWindow: ({
    state,
    onContinue,
    linkIdentityCta,
  }: {
    state: string;
    onContinue: () => void;
    linkIdentityCta?: { onClick?: () => void; hidden?: boolean };
  }) => (
    <div>
      <button onClick={onContinue}>score-{state}</button>
      {/* Like the real ScoreWindow (linkIdentityCta ?? {}): shown unless `hidden`, even if left out. */}
      {!linkIdentityCta?.hidden && <button onClick={linkIdentityCta?.onClick}>link-identity</button>}
    </div>
  ),
}));
vi.mock("../../../utils/waap", () => ({ isWaaPConnector: (c?: { id: string }) => c?.id === "waap" }));

import { OnboardingFlow } from "../../../components/WalletOnboarding/OnboardingFlow";
import { hasSeenOnboarding } from "../../../utils/onboardingStatus";

describe("OnboardingFlow", () => {
  beforeEach(() => {
    navigateToPageMock.mockReset();
    refreshScoreMock.mockReset();
    mockAccount = { address: "0xabc" };
    mockDatastore = { dbAccessToken: "tok", dbAccessTokenStatus: "connected" };
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    window.location.hash = "";
  });

  it("walks all six onboarding cards, then the score, then the dashboard", () => {
    render(<OnboardingFlow />);
    for (let page = 0; page < 6; page++) {
      expect(screen.getByText(`onboarding-page-${page}`)).toBeInTheDocument();
      fireEvent.click(screen.getByText("onboarding-continue"));
    }
    fireEvent.click(screen.getByText(/^score-/));
    expect(navigateToPageMock).toHaveBeenCalledWith("dashboard");
  });

  it("skip jumps from the cards straight to the score", () => {
    render(<OnboardingFlow />);
    fireEvent.click(screen.getByText("onboarding-skip"));
    expect(screen.queryByText("onboarding-continue")).not.toBeInTheDocument();
    expect(screen.getByText(/^score-/)).toBeInTheDocument();
  });

  it("shows the below or verified score state from the mock score", () => {
    vi.stubEnv("NODE_ENV", "development");
    window.location.hash = "#/wallet-onboarding?mock=boost";
    const { unmount } = render(<OnboardingFlow />);
    fireEvent.click(screen.getByText("onboarding-skip"));
    expect(screen.getByText("score-below")).toBeInTheDocument();
    unmount();

    window.location.hash = "#/wallet-onboarding?mock=nice";
    render(<OnboardingFlow />);
    fireEvent.click(screen.getByText("onboarding-skip"));
    expect(screen.getByText("score-verified")).toBeInTheDocument();
  });

  it("calls refreshScore on mount when authenticated", () => {
    render(<OnboardingFlow />);
    expect(refreshScoreMock).toHaveBeenCalledWith("0xabc", "tok", false);
  });

  it("redirects to home and does not fetch score when there is no address", () => {
    mockAccount = { address: undefined };
    render(<OnboardingFlow />);
    expect(navigateToPageMock).toHaveBeenCalledWith("home");
    expect(refreshScoreMock).not.toHaveBeenCalled();
  });

  it("redirects to home when the db access token is not connected", () => {
    mockDatastore = { dbAccessToken: undefined, dbAccessTokenStatus: "connecting" };
    render(<OnboardingFlow />);
    expect(navigateToPageMock).toHaveBeenCalledWith("home");
    expect(refreshScoreMock).not.toHaveBeenCalled();
  });

  // Onboarding shows once per account on a device: reaching the score step marks it seen.
  it("marks onboarding seen for the account only once the score step is reached", () => {
    render(<OnboardingFlow />);
    fireEvent.click(screen.getByText("onboarding-continue"));
    expect(hasSeenOnboarding("0xabc")).toBe(false);

    fireEvent.click(screen.getByText("onboarding-skip"));
    expect(hasSeenOnboarding("0xabc")).toBe(true);
    expect(hasSeenOnboarding("0xdef")).toBe(false);
  });

  it("does not mark onboarding seen in the dev mockup preview", () => {
    vi.stubEnv("NODE_ENV", "development");
    window.location.hash = "#/wallet-onboarding?mock=nice";
    render(<OnboardingFlow />);
    fireEvent.click(screen.getByText("onboarding-skip"));
    expect(hasSeenOnboarding("0xabc")).toBe(false);
  });

  // Linked wallets belong to a Human Wallet account; other sign-ins can't open that page.
  it("offers linking wallets to a Human Wallet account", () => {
    mockAccount = { address: "0xabc", connector: { id: "waap" } };
    render(<OnboardingFlow />);
    fireEvent.click(screen.getByText("onboarding-skip"));
    fireEvent.click(screen.getByText("link-identity"));
    expect(navigateToPageMock).toHaveBeenCalledWith("linked-wallets");
  });

  it("doesn't offer linking wallets to a MetaMask account", () => {
    mockAccount = { address: "0xabc", connector: { id: "io.metamask" } };
    render(<OnboardingFlow />);
    fireEvent.click(screen.getByText("onboarding-skip"));
    expect(screen.queryByText("link-identity")).not.toBeInTheDocument();
  });

  it("does not redirect or fetch in dev mockup preview mode (?mock)", () => {
    vi.stubEnv("NODE_ENV", "development");
    window.location.hash = "#/wallet-onboarding?mock=nice";
    mockAccount = { address: undefined };
    mockDatastore = { dbAccessToken: undefined, dbAccessTokenStatus: "connecting" };
    render(<OnboardingFlow />);
    expect(navigateToPageMock).not.toHaveBeenCalledWith("home");
    expect(refreshScoreMock).not.toHaveBeenCalled();
  });
});
