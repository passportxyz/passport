import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Dashboard from "../../pages/Dashboard";
import { UserContext, UserContextState } from "../../context/userContext";
import { mockAddress, mockWallet } from "../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../config/providers";
import { HashRouter as Router } from "react-router-dom";

jest.mock("../../utils/onboard.ts");

const mockHandleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const handleAddStamp = jest.fn();
const mockUserContext: UserContextState = {
  loggedIn: true,
  passport: undefined,
  isLoadingPassport: false,
  allProvidersState: {
    Google: {
      providerSpec: STAMP_PROVIDERS.Google,
      stamp: undefined,
    },
    Simple: {
      providerSpec: STAMP_PROVIDERS.Simple,
      stamp: undefined,
    },
    Ens: {
      providerSpec: STAMP_PROVIDERS.Ens,
      stamp: undefined,
    },
  },
  handleAddStamp: handleAddStamp,
  handleCreatePassport: mockCreatePassport,
  handleConnection: mockHandleConnection,
  address: mockAddress,
  wallet: mockWallet,
  signer: undefined,
  walletLabel: mockWallet.label,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("when user has a connected wallet", () => {
  it("should display wallet address", async () => {
    expect.assertions(1);

    render(
      <UserContext.Provider value={mockUserContext}>
        <Router>
          <Dashboard />
        </Router>
      </UserContext.Provider>
    );

    const expectedAddress = await screen.findByText(/0xmyAddress/);
    expect(expectedAddress).toBeInTheDocument();
  });

  it("should have a disconnect button", async () => {
    expect.assertions(2);

    render(
      <UserContext.Provider value={mockUserContext}>
        <Router>
          <Dashboard />
        </Router>
      </UserContext.Provider>
    );

    const disconnectWalletButton = screen.getByRole("button", {
      name: /Disconnect/,
    });

    expect(disconnectWalletButton).toBeInTheDocument();

    await userEvent.click(disconnectWalletButton);

    await waitFor(() => {
      expect(mockHandleConnection).toBeCalledTimes(1);
    });
  });
});

describe("when user has no passport", () => {
  const mockUserContextWithNoPassport: UserContextState = {
    ...mockUserContext,
    passport: undefined,
  };

  it("should display a loading spinner, and call create passport", async () => {
    render(
      <UserContext.Provider value={mockUserContextWithNoPassport}>
        <Router>
          <Dashboard />
        </Router>
      </UserContext.Provider>
    );

    expect(screen.getByTestId("loading-spinner")).toBeInTheDocument();

    await waitFor(() => {
      expect(mockCreatePassport).toBeCalledTimes(1);
    });
  });
});

describe("when the user has a passport", () => {
  const mockUserContextWithPassport = {
    ...mockUserContext,
    passport: {
      issuanceDate: new Date("2022-01-15"),
      expiryDate: new Date("2022-01-16"),
      stamps: [],
    },
  };

  it("it should not display a loading spinner", async () => {
    render(
      <UserContext.Provider value={mockUserContextWithPassport}>
        <Router>
          <Dashboard />
        </Router>
      </UserContext.Provider>
    );

    expect(screen.queryByTestId("loading-spinner")).not.toBeInTheDocument();
  });

  it("shows passport issuanceDate and expiryDate will be here", () => {
    render(
      <UserContext.Provider value={mockUserContextWithPassport}>
        <Router>
          <Dashboard />
        </Router>
      </UserContext.Provider>
    );

    const issuanceDateOnPage = screen.getByText(/2022-01-15/);
    const expiryDateOnPage = screen.getByText(/2022-01-16/);

    expect(issuanceDateOnPage).toBeInTheDocument();
    expect(expiryDateOnPage).toBeInTheDocument();
  });
});
