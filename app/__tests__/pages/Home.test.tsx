import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../../pages/Home";
import { LoginFlowProvider } from "../../hooks/useLoginFlow";
import { markOnboardingSeen } from "../../utils/onboardingStatus";
import { HashRouter as Router } from "react-router-dom";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
// import { useWeb3ModalAccount, openModalMock } from "../../__mocks__/web3modalMock";

vi.mock("wagmi", async () => ({
  ...(await vi.importActual("wagmi")),
  useAccount: () => ({ address: "0x123", isConnected: true }),
}));

vi.mock("../../utils/helpers", () => ({
  checkShowOnboard: vi.fn(),
  getProviderSpec: vi.fn(),
  beforeHumanPointsRelease: () => false,
  isServerOnMaintenance: () => false,
}));

vi.mock("../../");

const navigate = vi.fn();
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useNavigate: () => navigate,
}));

const mockConnect = vi.fn();

const mockWalletState = {
  address: "0x123",
  connect: mockConnect,
};

vi.mock("../../context/walletStore", () => ({
  useWalletStore: (callback: (state: any) => any) => callback(mockWalletState),
}));

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

test("renders connect wallet button", () => {
  renderWithContext(
    mockCeramicContext,
    <Router>
      <LoginFlowProvider>
        <Home />
      </LoginFlowProvider>
    </Router>
  );

  expect(screen.getByTestId("connectWalletButton"));
});

test("clicking connect wallet button calls connect", async () => {
  renderWithContext(
    mockCeramicContext,
    <Router>
      <LoginFlowProvider>
        <Home />
      </LoginFlowProvider>
    </Router>
  );
  const connectWalletButton = screen.getByTestId("connectWalletButton");

  await userEvent.click(connectWalletButton);

  await waitFor(() => {
    // expect(openModalMock).toBeCalledTimes(1);
  });
});

// Where a login lands (LoginFlowProvider): onboarding on an account's first login on this device,
// the dashboard after that.
describe("Post-login navigation", () => {
  beforeEach(() => localStorage.clear());

  it("navigates to onboarding on the account's first login on this device", async () => {
    renderWithContext(
      { ...mockCeramicContext, passport: undefined },
      <Router>
        <LoginFlowProvider>
          <Home />
        </LoginFlowProvider>
      </Router>
    );

    const connectWalletButton = screen.getByTestId("connectWalletButton");

    await userEvent.click(connectWalletButton);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/wallet-onboarding");
    });
  });

  it("navigates to the dashboard once the account has seen onboarding on this device", async () => {
    markOnboardingSeen("0x123");
    renderWithContext(
      { ...mockCeramicContext, passport: undefined },
      <Router>
        <LoginFlowProvider>
          <Home />
        </LoginFlowProvider>
      </Router>
    );

    const connectWalletButton = screen.getByTestId("connectWalletButton");

    await userEvent.click(connectWalletButton);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/dashboard");
    });
  });
});
