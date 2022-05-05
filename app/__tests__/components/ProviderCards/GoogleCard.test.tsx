import React from "react";
import { render, screen } from "@testing-library/react";
import { GoogleCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { googleStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";

jest.mock("../../../utils/onboard.ts");

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
  },
  handleAddStamp: handleAddStamp,
  handleCreatePassport: mockCreatePassport,
  handleConnection: mockHandleConnection,
  address: mockAddress,
  wallet: mockWallet,
  signer: undefined,
  walletLabel: mockWallet.label,
};

describe("when user has not verfied with GoogleProvider", () => {
  it("should display a google verification button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <GoogleCard />
      </UserContext.Provider>
    );

    const verifyGoogleButton = screen.queryByRole("button", {
      name: /Verify/,
    });

    expect(verifyGoogleButton).toBeInTheDocument();
  });
});

describe("when user has verified with GoogleProvider", () => {
  it("should display that google is verified", () => {
    render(
      <UserContext.Provider
        value={{
          ...mockUserContext,
          allProvidersState: {
            Google: {
              providerSpec: STAMP_PROVIDERS.Google,
              stamp: googleStampFixture,
            },
            Simple: {
              providerSpec: STAMP_PROVIDERS.Simple,
              stamp: undefined,
            },
          },
        }}
      >
        <GoogleCard />
      </UserContext.Provider>
    );

    const googleVerified = screen.queryByText(/Verified/);

    expect(googleVerified).toBeInTheDocument();
  });
});
