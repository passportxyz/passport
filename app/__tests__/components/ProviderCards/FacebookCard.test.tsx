import React from "react";
import { render, screen } from "@testing-library/react";
import { FacebookCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { facebookStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";

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
    Facebook: {
      providerSpec: STAMP_PROVIDERS.Facebook,
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

describe("when user has not verified with FacebookProvider", () => {
  it("should display a facebook verification button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <FacebookCard />
      </UserContext.Provider>
    );

    const verifyFacebookButton = screen.queryByTestId("button-verify-facebook");

    expect(verifyFacebookButton).toBeInTheDocument();
  });
});

describe("when user has verified with FacebookProvider", () => {
  it("should display that facebook is verified", () => {
    render(
      <UserContext.Provider
        value={{
          ...mockUserContext,
          allProvidersState: {
            Facebook: {
              providerSpec: STAMP_PROVIDERS.Facebook,
              stamp: facebookStampFixture,
            },
          },
        }}
      >
        <FacebookCard />
      </UserContext.Provider>
    );

    const facebookVerified = screen.queryByText(/Verified/);

    expect(facebookVerified).toBeInTheDocument();
  });
});
