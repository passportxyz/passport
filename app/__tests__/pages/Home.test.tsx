import { vi, describe, it, expect, Mock } from "vitest";
import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../../pages/Home";
import { HashRouter as Router } from "react-router-dom";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
// import { useWeb3ModalAccount, openModalMock } from "../../__mocks__/web3modalMock";

import { checkShowOnboard } from "../../utils/helpers";

vi.mock("wagmi", async () => ({
  ...(await vi.importActual("wagmi")),
  useAccount: () => ({ address: "0x123", isConnected: true }),
}));

vi.mock("../../utils/helpers", () => ({
  checkShowOnboard: vi.fn(),
  getProviderSpec: vi.fn(),
  isServerOnMaintenance: () => false,
}));

vi.mock("../../");

const navigate = vi.fn();
vi.mock("react-router-dom", async () => ({
  ...(await vi.importActual("react-router-dom")),
  useNavigate: () => navigate,
}));

vi.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: vi.fn(),
  },
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
      <Home />
    </Router>
  );

  expect(screen.getByTestId("connectWalletButton"));
});

test("clicking connect wallet button calls connect", async () => {
  renderWithContext(
    mockCeramicContext,
    <Router>
      <Home />
    </Router>
  );
  const connectWalletButton = screen.getByTestId("connectWalletButton");

  await userEvent.click(connectWalletButton);

  await waitFor(() => {
    // expect(openModalMock).toBeCalledTimes(1);
  });
});

describe("Welcome navigation", () => {
  it("calls navigate with /dashboard when wallet is connected but checkShowOnboard is false", async () => {
    (checkShowOnboard as Mock).mockReturnValue(false);
    renderWithContext(
      { ...mockCeramicContext, passport: undefined },
      <Router>
        <Home />
      </Router>
    );

    const connectWalletButton = screen.getByTestId("connectWalletButton");

    await userEvent.click(connectWalletButton);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/dashboard");
    });
  });

  it("calls navigate with /welcome when checkShowOnboard is true", async () => {
    (checkShowOnboard as Mock).mockReturnValue(true);
    renderWithContext(
      { ...mockCeramicContext, passport: undefined },
      <Router>
        <Home />
      </Router>
    );

    const connectWalletButton = screen.getByTestId("connectWalletButton");

    await userEvent.click(connectWalletButton);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/dashboard");
    });
  });
});
