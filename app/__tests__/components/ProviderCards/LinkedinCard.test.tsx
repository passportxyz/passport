import React from "react";
import { render, screen } from "@testing-library/react";
import { LinkedinCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { linkedinStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";

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
    Linkedin: {
      providerSpec: STAMP_PROVIDERS.Linkedin,
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

describe("when user has not verfied with LinkedinProvider", () => {
  it("should display a linkedin verification button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <LinkedinCard />
      </UserContext.Provider>
    );

    const linkedinVerifyButton = screen.queryByTestId("button-verify-linkedin");

    expect(linkedinVerifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with LinkedinProvider", () => {
  it("should display that linkedin is verified", () => {
    render(
      <UserContext.Provider
        value={{
          ...mockUserContext,
          allProvidersState: {
            Linkedin: {
              providerSpec: STAMP_PROVIDERS.Linkedin,
              stamp: linkedinStampFixture,
            },
          },
        }}
      >
        <LinkedinCard />
      </UserContext.Provider>
    );

    const linkedinVerified = screen.queryByText(/Verified/);

    expect(linkedinVerified).toBeInTheDocument();
  });
});
