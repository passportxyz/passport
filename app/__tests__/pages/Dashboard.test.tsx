import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import Dashboard from "../../pages/Dashboard";
import { UserContext, UserContextState } from "../../context/userContext";
import { mockAddress, mockWallet } from "../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../config/providers";
import { HashRouter as Router } from "react-router-dom";
import * as framework from "@self.id/framework";

jest.mock("../../utils/onboard.ts");

jest.mock("@self.id/framework", () => {
  return {
    useViewerConnection: jest.fn(),
  };
});

const mockHandleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const handleAddStamp = jest.fn();
const mockUserContext: UserContextState = {
  userDid: undefined,
  loggedIn: true,
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
  address: mockAddress,
  wallet: mockWallet,
  signer: undefined,
  walletLabel: mockWallet.label,
};

beforeEach(() => {
  jest.clearAllMocks();
  (framework.useViewerConnection as jest.Mock).mockImplementation(() => [
    {
      status: "connected",
    },
    jest.fn(),
    jest.fn(),
  ]);
});

describe("when user has no passport", () => {
  const mockUserContextWithNoPassport: UserContextState = {
    ...mockUserContext,
    passport: false,
  };

  it("should display a loading spinner, and call create passport", async () => {
    render(
      <UserContext.Provider value={mockUserContextWithNoPassport}>
        <Router>
          <Dashboard />
        </Router>
      </UserContext.Provider>
    );

    expect(screen.getByTestId("loading-spinner-passport")).toBeInTheDocument();

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

    expect(screen.queryByTestId("loading-spinner-passport")).not.toBeInTheDocument();
  });

  it("shows Passport JSON button", () => {
    render(
      <UserContext.Provider value={mockUserContextWithPassport}>
        <Router>
          <Dashboard />
        </Router>
      </UserContext.Provider>
    );

    expect(screen.getByTestId("button-passport-json")).toBeInTheDocument();
  });
});

describe("when the user clicks Passport JSON", () => {
  const mockUserContextWithPassport = {
    ...mockUserContext,
    passport: {
      issuanceDate: new Date("2022-01-15"),
      expiryDate: new Date("2022-01-16"),
      stamps: [],
    },
  };

  it("it should display a modal", async () => {
    render(
      <UserContext.Provider value={mockUserContextWithPassport}>
        <Router>
          <Dashboard />
        </Router>
      </UserContext.Provider>
    );

    const buttonPassportJson = screen.queryByTestId("button-passport-json");

    fireEvent.click(buttonPassportJson!);

    const verifyModal = await screen.findByRole("dialog");
    const buttonDone = screen.getByTestId("button-passport-json-done");

    expect(verifyModal).toBeInTheDocument();
    expect(buttonDone).toBeInTheDocument();
  });
});

describe("when viewer connection status is connecting", () => {
  const mockUserContextWithPassport = {
    ...mockUserContext,
    passport: {
      issuanceDate: new Date("2022-01-15"),
      expiryDate: new Date("2022-01-16"),
      stamps: [],
    },
  };
  it("should show a 'waiting for signature' alert", () => {
    (framework.useViewerConnection as jest.Mock).mockReturnValue([{ status: "connecting" }]);
    render(
      <UserContext.Provider value={mockUserContextWithPassport}>
        <Router>
          <Dashboard />
        </Router>
      </UserContext.Provider>
    );

    const waitingForSignature = screen.getByTestId("selfId-connection-alert");
    expect(waitingForSignature).toBeInTheDocument();
  });
});
