import React from "react";
import { render, screen } from "@testing-library/react";
import { EnsCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { ensStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";

jest.mock("../../../utils/onboard.ts");

const mockHandleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const mockHasStamp = jest.fn(() => false);
const getStampIndex = jest.fn();
const handleSaveStamp = jest.fn();
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
  hasStamp: mockHasStamp,
  getStampIndex: getStampIndex,
  handleSaveStamp: handleSaveStamp,
  handleAddStamp: handleAddStamp,
  handleCreatePassport: mockCreatePassport,
  handleConnection: mockHandleConnection,
  address: mockAddress,
  connectedWallets: [mockWallet],
  signer: undefined,
  walletLabel: mockWallet.label,
};

describe("when user has not verfied with EnsProvider", () => {
  it("should display a verification button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <EnsCard />
      </UserContext.Provider>
    );

    const verifyButton = screen.queryByRole("button", {
      name: /Verify/,
    });

    expect(verifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with EnsProvider", () => {
  it("should display that ens is verified", () => {
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
              stamp: undefined,
            },
            Ens: {
              providerSpec: STAMP_PROVIDERS.Ens,
              stamp: ensStampFixture,
            },
          },
        }}
      >
        <EnsCard />
      </UserContext.Provider>
    );

    const ensVerified = screen.queryByText(/Verified/);

    expect(ensVerified).toBeInTheDocument();
  });
});
