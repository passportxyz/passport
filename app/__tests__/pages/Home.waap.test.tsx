import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HashRouter as Router } from "react-router-dom";
import Home from "../../pages/Home";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";

// Home reads the shared login flow (LoginFlowProvider); its own behaviour is tested in
// __tests__/hooks/useLoginFlow.waap.test.tsx.
const signIn = vi.fn();
let loginFlow = { signIn, isBusy: false, isLoggingIn: false, loginStep: "NOT_STARTED" };

vi.mock("../../hooks/useLoginFlow", () => ({
  useLoginFlow: () => loginFlow,
}));

let mockAccount: { address?: string; isConnected: boolean } = { isConnected: false };
vi.mock("wagmi", async (importOriginal) => ({
  ...(await importOriginal<typeof import("wagmi")>()),
  useAccount: () => mockAccount,
}));

vi.mock("../../utils/helpers", () => ({
  checkShowOnboard: vi.fn(),
  getProviderSpec: vi.fn(),
  beforeHumanPointsRelease: () => false,
  isServerOnMaintenance: () => false,
}));

const renderHome = () =>
  renderWithContext(
    makeTestCeramicContext(),
    <Router>
      <Home />
    </Router>
  );

const button = () => screen.getByTestId("connectWalletButton") as HTMLButtonElement;

// Shaped like a Passport session token: RS256 header plus an expiry (see datastoreConnectionContext).
const sessionToken = (expiresInSeconds: number) =>
  [
    btoa(JSON.stringify({ alg: "RS256" })),
    btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiresInSeconds })),
    "sig",
  ].join(".");

describe("Home sign-in options", () => {
  beforeEach(() => {
    signIn.mockClear();
    loginFlow = { signIn, isBusy: false, isLoggingIn: false, loginStep: "NOT_STARTED" };
    mockAccount = { isConnected: false };
    localStorage.clear();
  });

  // After a refresh the wallet reconnects; a still-valid session resumes without a new signature.
  it("resumes a still-valid session when the wallet reconnects", () => {
    mockAccount = { address: "0xabc", isConnected: true };
    localStorage.setItem("dbcache-token-0xabc", sessionToken(3600));
    renderHome();

    expect(signIn).toHaveBeenCalledTimes(1);
    expect(signIn.mock.calls[0]).toEqual([]);
  });

  it("does not resume when the saved session has expired", () => {
    mockAccount = { address: "0xabc", isConnected: true };
    localStorage.setItem("dbcache-token-0xabc", sessionToken(-60));
    renderHome();

    expect(signIn).not.toHaveBeenCalled();
  });

  // A login already running (started from the header, say) must not start a second one.
  it("does not resume while a login is already running", () => {
    mockAccount = { address: "0xabc", isConnected: true };
    localStorage.setItem("dbcache-token-0xabc", sessionToken(3600));
    loginFlow = { ...loginFlow, isBusy: true, isLoggingIn: true, loginStep: "PENDING_DATABASE_CONNECTION" };
    renderHome();

    expect(signIn).not.toHaveBeenCalled();
  });

  // One sign-in: WaaP's window, which also lists external wallets.
  it("has a single Connect wallet button that opens the WaaP login", async () => {
    renderHome();

    expect(screen.queryByTestId("humanWalletButton")).toBeNull();
    expect(button().textContent).toContain("Connect wallet");

    await userEvent.click(button());

    expect(signIn).toHaveBeenCalledWith({ useWaap: true });
  });

  it("shows the button as busy with the shared login state", () => {
    loginFlow = { ...loginFlow, isBusy: true };
    renderHome();

    expect(button().disabled).toBe(true);
    expect(button().querySelector('[data-testid="spinner"]')).not.toBeNull();
  });

  it("leaves the button enabled when nothing is running", () => {
    renderHome();

    expect(button().disabled).toBe(false);
    expect(button().querySelector('[data-testid="spinner"]')).toBeNull();
  });
});
