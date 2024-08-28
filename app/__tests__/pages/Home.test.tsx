import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../../components/Home";
import { HashRouter as Router } from "react-router-dom";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { useWeb3ModalAccount, openModalMock } from "../../__mocks__/web3modalMock";

import { checkShowOnboard } from "../../utils/helpers";

jest.mock("../../utils/helpers", () => ({
  checkShowOnboard: jest.fn(),
  getProviderSpec: jest.fn(),
  isServerOnMaintenance: () => false,
}));

const navigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => navigate,
}));

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

const mockConnect = jest.fn();

const mockWalletState = {
  address: "0x123",
  connect: mockConnect,
};

jest.mock("../../context/walletStore", () => ({
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
  const oldUseWeb3ModalAccount = useWeb3ModalAccount;
  (useWeb3ModalAccount as any) = () => ({
    isConnected: false,
  });

  renderWithContext(
    mockCeramicContext,
    <Router>
      <Home />
    </Router>
  );
  const connectWalletButton = screen.getByTestId("connectWalletButton");

  await userEvent.click(connectWalletButton);

  await waitFor(() => {
    expect(openModalMock).toBeCalledTimes(1);
  });

  (useWeb3ModalAccount as any) = oldUseWeb3ModalAccount;
});

describe("Welcome navigation", () => {
  it("calls navigate with /dashboard when wallet is connected but checkShowOnboard is false", async () => {
    (checkShowOnboard as jest.Mock).mockReturnValue(false);
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
    (checkShowOnboard as jest.Mock).mockReturnValue(true);
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
