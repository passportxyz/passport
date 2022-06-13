import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "../../pages/Home";
import { UserContext, UserContextState } from "../../context/userContext";
import { STAMP_PROVIDERS } from "../../config/providers";
import { HashRouter as Router } from "react-router-dom";

jest.mock("../../utils/onboard.ts");

const mockHandleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const handleAddStamp = jest.fn();
const mockUserContext: UserContextState = {
  userDid: undefined,
  loggedIn: false,
  passport: {
    issuanceDate: new Date(),
    expiryDate: new Date(),
    stamps: [],
  },
  isLoadingPassport: false,
  allProvidersState: {
    Google: {
      providerSpec: STAMP_PROVIDERS.Google,
      stamp: undefined,
    },
    Ens: {
      providerSpec: STAMP_PROVIDERS.Ens,
      stamp: undefined,
    },
    Poh: {
      providerSpec: STAMP_PROVIDERS.Poh,
      stamp: undefined,
    },
    Twitter: {
      providerSpec: STAMP_PROVIDERS.Twitter,
      stamp: undefined,
    },
    POAP: {
      providerSpec: STAMP_PROVIDERS.POAP,
      stamp: undefined,
    },
    Facebook: {
      providerSpec: STAMP_PROVIDERS.Facebook,
      stamp: undefined,
    },
    Brightid: {
      providerSpec: STAMP_PROVIDERS.Brightid,
      stamp: undefined,
    },
  },
  handleAddStamp: handleAddStamp,
  handleCreatePassport: mockCreatePassport,
  handleConnection: mockHandleConnection,
  address: undefined,
  wallet: null,
  signer: undefined,
  walletLabel: undefined,
};

test("renders connect wallet button", () => {
  expect.assertions(1);
  render(
    <UserContext.Provider value={mockUserContext}>
      <Router>
        <Home />
      </Router>
    </UserContext.Provider>
  );
  const connectWalletButton = screen.getByTestId("connectWalletButton");
  expect(connectWalletButton).toBeInTheDocument();
});

test("clicking connect wallet button calls handleConnection", async () => {
  expect.assertions(1);

  render(
    <UserContext.Provider value={mockUserContext}>
      <Router>
        <Home />
      </Router>
    </UserContext.Provider>
  );
  const connectWalletButton = screen.getByTestId("connectWalletButton");

  await userEvent.click(connectWalletButton);

  await waitFor(() => {
    expect(mockHandleConnection).toBeCalledTimes(1);
  });
});
