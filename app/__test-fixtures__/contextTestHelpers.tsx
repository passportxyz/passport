import { UserContext, UserContextState } from "../context/userContext";
import { CeramicContext, CeramicContextState, IsLoadingPassportState } from "../context/ceramicContext";
import { STAMP_PROVIDERS } from "../config/providers";
import { mockAddress, mockWallet } from "./onboardHookValues";
import React from "react";
import { render } from "@testing-library/react";

export const makeTestUserContext = (initialState?: Partial<UserContextState>): UserContextState => {
  return {
    loggedIn: true,
    handleConnection: jest.fn(),
    address: mockAddress,
    wallet: mockWallet,
    signer: undefined,
    walletLabel: mockWallet.label,
    ...initialState,
  };
};

export const makeTestCeramicContext = (initialState?: Partial<CeramicContextState>): CeramicContextState => {
  return {
    userDid: undefined,
    passport: {
      issuanceDate: new Date(),
      expiryDate: new Date(),
      stamps: [],
    },
    isLoadingPassport: IsLoadingPassportState.Idle,
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
      Github: {
        providerSpec: STAMP_PROVIDERS.Github,
        stamp: undefined,
      },
      Linkedin: {
        providerSpec: STAMP_PROVIDERS.Linkedin,
        stamp: undefined,
      },
      Discord: {
        providerSpec: STAMP_PROVIDERS.Discord,
        stamp: undefined,
      },
      Coinbase: {
        providerSpec: STAMP_PROVIDERS.Coinbase,
        stamp: undefined,
      },
    },
    handleAddStamp: jest.fn(),
    handleCreatePassport: jest.fn(),
    ...initialState,
  };
};

export const renderWithContext = (
  userContext: UserContextState,
  ceramicContext: CeramicContextState,
  ui: React.ReactElement<any, string | React.JSXElementConstructor<any>>
) => {
  render(
    <UserContext.Provider value={userContext}>
      <CeramicContext.Provider value={ceramicContext}>{ui}</CeramicContext.Provider>
    </UserContext.Provider>
  );
};
