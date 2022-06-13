import React from "react";
import { render, screen } from "@testing-library/react";
import { TwitterCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { twitterStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";

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
    Twitter: {
      providerSpec: STAMP_PROVIDERS.Twitter,
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

describe("when user has not verfied with TwitterProvider", () => {
  it("should display a twitter verification button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <TwitterCard />
      </UserContext.Provider>
    );

    const twitterVerifyButton = screen.queryByTestId("button-verify-twitter");

    expect(twitterVerifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with TwitterProvider", () => {
  it("should display that twitter is verified", () => {
    render(
      <UserContext.Provider
        value={{
          ...mockUserContext,
          allProvidersState: {
            Twitter: {
              providerSpec: STAMP_PROVIDERS.Twitter,
              stamp: twitterStampFixture,
            },
          },
        }}
      >
        <TwitterCard />
      </UserContext.Provider>
    );

    const twitterVerified = screen.queryByText(/Verified/);

    expect(twitterVerified).toBeInTheDocument();
  });
});
