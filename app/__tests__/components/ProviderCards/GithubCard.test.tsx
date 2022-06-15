import React from "react";
import { render, screen } from "@testing-library/react";
import { GithubCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { githubStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";

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
    Github: {
      providerSpec: STAMP_PROVIDERS.Github,
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

describe("when user has not verfied with GithubProvider", () => {
  it("should display a github verification button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <GithubCard />
      </UserContext.Provider>
    );

    const githubVerifyButton = screen.queryByTestId("button-verify-github");

    expect(githubVerifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with GithubProvider", () => {
  it("should display that github is verified", () => {
    render(
      <UserContext.Provider
        value={{
          ...mockUserContext,
          allProvidersState: {
            Github: {
              providerSpec: STAMP_PROVIDERS.Github,
              stamp: githubStampFixture,
            },
          },
        }}
      >
        <GithubCard />
      </UserContext.Provider>
    );

    const githubVerified = screen.queryByText(/Verified/);

    expect(githubVerified).toBeInTheDocument();
  });
});
