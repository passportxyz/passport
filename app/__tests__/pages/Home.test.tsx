import React from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../../pages/Home";
import { UserContextState } from "../../context/userContext";
import { HashRouter as Router } from "react-router-dom";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";

import { checkShowOnboard } from "../../utils/helpers";
import { WalletState } from "@web3-onboard/core";

jest.mock("../../utils/helpers", () => ({
  checkShowOnboard: jest.fn(),
  getProviderSpec: jest.fn(),
}));

const navigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => navigate,
}));

jest.mock("../../utils/onboard.ts");

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

const mockConnect = jest.fn();

const mockUserContext: UserContextState = makeTestUserContext({
  loggedIn: false,
  connect: mockConnect,
  address: undefined,
  wallet: null,
  signer: undefined,
  walletLabel: undefined,
});
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

test("renders connect wallet button", () => {
  renderWithContext(
    mockUserContext,
    mockCeramicContext,
    <Router>
      <Home />
    </Router>
  );

  expect(screen.getByTestId("connectWalletButton"));
});

test("clicking connect wallet button calls connect", async () => {
  expect.assertions(1);

  renderWithContext(
    mockUserContext,
    mockCeramicContext,
    <Router>
      <Home />
    </Router>
  );
  const connectWalletButton = screen.getByTestId("connectWalletButton");

  await userEvent.click(connectWalletButton);

  await waitFor(() => {
    expect(mockConnect).toBeCalledTimes(1);
  });
});

describe("Welcome navigation", () => {
  it("calls navigate with /dashboard when wallet is connected but checkShowOnboard is false", () => {
    (checkShowOnboard as jest.Mock).mockReturnValue(false);
    renderWithContext(
      { ...mockUserContext, wallet: {} as WalletState },
      { ...mockCeramicContext, passport: undefined },
      <Router>
        <Home />
      </Router>
    );
    expect(navigate).toHaveBeenCalledWith("/dashboard");
  });

  it("calls navigate with /welcome when checkShowOnboard is true", () => {
    (checkShowOnboard as jest.Mock).mockReturnValue(true);
    renderWithContext(
      { ...mockUserContext, wallet: {} as WalletState },
      { ...mockCeramicContext, passport: undefined },
      <Router>
        <Home />
      </Router>
    );
    expect(navigate).toHaveBeenCalledWith("/welcome");
  });
  it("should show wallet connection error toast if error is encountered", async () => {
    renderWithContext(
      {
        ...mockUserContext,
        wallet: {} as WalletState,
        walletConnectionError: "error",
        setWalletConnectionError: jest.fn(),
      },
      { ...mockCeramicContext, passport: undefined },
      <Router>
        <Home />
      </Router>
    );
    await waitFor(() => {
      expect(screen.getByText("Connection Error"));
    });
  });
});
