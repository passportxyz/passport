import { UserContext, UserContextState } from "../context/userContext";
import { CeramicContext, CeramicContextState, IsLoadingPassportState } from "../context/ceramicContext";
import { ProviderSpec, STAMP_PROVIDERS } from "../config/providers";
import { mockAddress, mockWallet } from "./onboardHookValues";
import React from "react";
import { render } from "@testing-library/react";
import { PLATFORM_ID } from "@gitcoin/passport-types";

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

const getProviderSpec = (platform: PLATFORM_ID, provider: string): ProviderSpec => {
  return STAMP_PROVIDERS[platform]
    ?.find((i) => i.providers.find((p) => p.name == provider))
    ?.providers.find((p) => p.name == provider) as ProviderSpec;
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
        providerSpec: STAMP_PROVIDERS.Google as unknown as ProviderSpec,
        stamp: undefined,
      },
      Ens: {
        providerSpec: getProviderSpec("Ens", "Ens"),
        stamp: undefined,
      },
      Poh: {
        providerSpec: getProviderSpec("Poh", "Poh"),
        stamp: undefined,
      },
      Twitter: {
        providerSpec: getProviderSpec("Twitter", "Twitter"),
        stamp: undefined,
      },
      TwitterFollowerGT100: {
        providerSpec: getProviderSpec("Twitter", "TwitterFollowerGT100"),
        stamp: undefined,
      },
      TwitterFollowerGT500: {
        providerSpec: getProviderSpec("Twitter", "TwitterFollowerGT500"),
        stamp: undefined,
      },
      TwitterFollowerGTE1000: {
        providerSpec: getProviderSpec("Twitter", "TwitterFollowerGTE1000"),
        stamp: undefined,
      },
      TwitterFollowerGT5000: {
        providerSpec: getProviderSpec("Twitter", "TwitterFollowerGT5000"),
        stamp: undefined,
      },
      TwitterTweetGT10: {
        providerSpec: getProviderSpec("Twitter", "TwitterTweetGT10"),
        stamp: undefined,
      },
      POAP: {
        providerSpec: getProviderSpec("POAP", "POAP"),
        stamp: undefined,
      },
      Facebook: {
        providerSpec: getProviderSpec("Facebook", "Facebook"),
        stamp: undefined,
      },
      Brightid: {
        providerSpec: getProviderSpec("Brightid", "Brightid"),
        stamp: undefined,
      },
      Github: {
        providerSpec: getProviderSpec("Github", "Github"),
        stamp: undefined,
      },
      Linkedin: {
        providerSpec: getProviderSpec("Linkedin", "Linkedin"),
        stamp: undefined,
      },
      Discord: {
        providerSpec: getProviderSpec("Discord", "Discord"),
        stamp: undefined,
      },
      Signer: {
        providerSpec: getProviderSpec("Signer", "Signer"),
        stamp: undefined,
      },
      GitPOAP: {
        providerSpec: getProviderSpec("GitPOAP", "GitPOAP"),
        stamp: undefined,
      },
    },
    handleAddStamp: jest.fn(),
    handleAddStamps: jest.fn(),
    handleCreatePassport: jest.fn(),
    handleDeleteStamp: jest.fn(),
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
