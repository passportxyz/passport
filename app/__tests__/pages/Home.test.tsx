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
}));

const navigate = jest.fn();
(checkShowOnboard as jest.Mock).mockReturnValue(true);
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

const mockToggleConnection = jest.fn();

const mockUserContext: UserContextState = makeTestUserContext({
  loggedIn: false,
  toggleConnection: mockToggleConnection,
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

test("clicking connect wallet button calls toggleConnection", async () => {
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
    expect(mockToggleConnection).toBeCalledTimes(1);
  });
});

describe("Welcome navigation", () => {
  it("calls navigate with /dashboard when wallet is connected and feature flag is off", () => {
    process.env.NEXT_PUBLIC_FF_ONE_CLICK_VERIFICATION = "off";
    renderWithContext(
      { ...mockUserContext, wallet: {} as WalletState },
      { ...mockCeramicContext, passport: undefined },
      <Router>
        <Home />
      </Router>
    );
    expect(navigate).toHaveBeenCalledWith("/dashboard");
  });

  it("calls navigate with /dashboard when wallet is connected and feature flag is on but checkShowOnboard is false", () => {
    process.env.NEXT_PUBLIC_FF_ONE_CLICK_VERIFICATION = "off";
    renderWithContext(
      { ...mockUserContext, wallet: {} as WalletState },
      { ...mockCeramicContext, passport: undefined },
      <Router>
        <Home />
      </Router>
    );
    expect(navigate).toHaveBeenCalledWith("/dashboard");
  });

  it("calls navigate with /welcome when feature flag is on and checkShowOnboard is true", () => {
    process.env.NEXT_PUBLIC_FF_ONE_CLICK_VERIFICATION = "off";
    renderWithContext(
      { ...mockUserContext, wallet: {} as WalletState },
      { ...mockCeramicContext, passport: undefined },
      <Router>
        <Home />
      </Router>
    );
    expect(navigate).toHaveBeenCalledWith("/dashboard");
  });
});
