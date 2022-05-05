import React from "react";
import { render, screen } from "@testing-library/react";
import { SimpleCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { simpleStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";

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

describe("when user has not verified with SimpleProvider", () => {
  it("should display a verification button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <SimpleCard />
      </UserContext.Provider>
    );

    const verifyButton = screen.queryByRole("button", {
      name: /Verify/,
    });

    expect(verifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with SimpleProvider", () => {
  it("should display that user is verified", () => {
    render(
      <UserContext.Provider
        value={{
          ...mockUserContext,
          allProvidersState: {
            Google: {
              providerSpec: STAMP_PROVIDERS.Google,
              stamp: undefined,
            },
            Simple: {
              providerSpec: STAMP_PROVIDERS.Simple,
              stamp: simpleStampFixture,
            },
          },
        }}
      >
        <SimpleCard />
      </UserContext.Provider>
    );

    const verified = screen.queryByText(/Verified/);

    expect(verified).toBeInTheDocument();
  });
});
