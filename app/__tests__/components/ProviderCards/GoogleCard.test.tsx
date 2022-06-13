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
const handleAddStamp = jest.fn().mockResolvedValue(undefined);
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

    const verifyGoogleButton = screen.queryByTestId("button-verify-google");

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
