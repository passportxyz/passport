import React from "react";
import { render, screen } from "@testing-library/react";
import { DiscordCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { discordStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";

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
    Discord: {
      providerSpec: STAMP_PROVIDERS.Discord,
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

describe("when user has not verfied with DiscordProvider", () => {
  it("should display a discord verification button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <DiscordCard />
      </UserContext.Provider>
    );

    const discordVerifyButton = screen.queryByTestId("button-verify-discord");

    expect(discordVerifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with DiscordProvider", () => {
  it("should display that discord is verified", () => {
    render(
      <UserContext.Provider
        value={{
          ...mockUserContext,
          allProvidersState: {
            Discord: {
              providerSpec: STAMP_PROVIDERS.Discord,
              stamp: discordStampFixture,
            },
          },
        }}
      >
        <DiscordCard />
      </UserContext.Provider>
    );

    const discordVerified = screen.queryByText(/Verified/);

    expect(discordVerified).toBeInTheDocument();
  });
});
