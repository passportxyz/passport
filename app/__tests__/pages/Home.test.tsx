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

jest.mock("../../utils/onboard.ts");

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
