import { UserContext, UserContextState } from "../context/userContext";
import { ScorerContext, ScorerContextState } from "../context/scorerContext";
import { CeramicContext, CeramicContextState, IsLoadingPassportState } from "../context/ceramicContext";
import { ProviderSpec, STAMP_PROVIDERS } from "../config/providers";
import { mockAddress, mockWallet } from "./onboardHookValues";
import React from "react";
import { render } from "@testing-library/react";
import { PLATFORM_ID } from "@gitcoin/passport-types";
import { PlatformProps } from "../components/GenericPlatform";
import { OnChainContextState } from "../context/onChainContext";
import { StampClaimingContext, StampClaimingContextState } from "../context/stampClaimingContext";

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

export const makeTestUserContext = (initialState?: Partial<UserContextState>): UserContextState => {
  return {
    loggedIn: true,
    loggingIn: false,
    toggleConnection: jest.fn(),
    handleDisconnection: jest.fn(),
    address: mockAddress,
    wallet: mockWallet,
    signer: undefined,
    walletLabel: mockWallet.label,
    dbAccessToken: "token",
    dbAccessTokenStatus: "idle",
    userWarning: undefined,
    setUserWarning: jest.fn(),
    ...initialState,
  };
};

export const getProviderSpec = (platform: PLATFORM_ID, provider: string): ProviderSpec => {
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
    allPlatforms: new Map<PLATFORM_ID, PlatformProps>(),
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
      POAP: {
        providerSpec: getProviderSpec("POAP", "POAP"),
        stamp: undefined,
      },
      Facebook: {
        providerSpec: getProviderSpec("Facebook", "Facebook"),
        stamp: undefined,
      },
      FacebookProfilePicture: {
        providerSpec: getProviderSpec("Facebook", "FacebookProfilePicture"),
        stamp: undefined,
      },
      Brightid: {
        providerSpec: getProviderSpec("Brightid", "Brightid"),
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
      "GitcoinContributorStatistics#numGrantsContributeToGte#1": {
        providerSpec: getProviderSpec("Gitcoin", "GitcoinContributorStatistics#numGrantsContributeToGte#1"),
        stamp: undefined,
      },
      "GitcoinContributorStatistics#numGrantsContributeToGte#10": {
        providerSpec: getProviderSpec("Gitcoin", "GitcoinContributorStatistics#numGrantsContributeToGte#10"),
        stamp: undefined,
      },
      "GitcoinContributorStatistics#numGrantsContributeToGte#25": {
        providerSpec: getProviderSpec("Gitcoin", "GitcoinContributorStatistics#numGrantsContributeToGte#25"),
        stamp: undefined,
      },
      "GitcoinContributorStatistics#numGrantsContributeToGte#100": {
        providerSpec: getProviderSpec("Gitcoin", "GitcoinContributorStatistics#numGrantsContributeToGte#100"),
        stamp: undefined,
      },
      "GitcoinContributorStatistics#totalContributionAmountGte#10": {
        providerSpec: getProviderSpec("Gitcoin", "GitcoinContributorStatistics#totalContributionAmountGte#10"),
        stamp: undefined,
      },
      "GitcoinContributorStatistics#totalContributionAmountGte#100": {
        providerSpec: getProviderSpec("Gitcoin", "GitcoinContributorStatistics#totalContributionAmountGte#100"),
        stamp: undefined,
      },
      "GitcoinContributorStatistics#totalContributionAmountGte#1000": {
        providerSpec: getProviderSpec("Gitcoin", "GitcoinContributorStatistics#totalContributionAmountGte#1000"),
        stamp: undefined,
      },
      "GitcoinContributorStatistics#numRoundsContributedToGte#1": {
        providerSpec: getProviderSpec("Gitcoin", "GitcoinContributorStatistics#numRoundsContributedToGte#1"),
        stamp: undefined,
      },
      "GitcoinContributorStatistics#numGr14ContributionsGte#1": {
        providerSpec: getProviderSpec("Gitcoin", "GitcoinContributorStatistics#numGr14ContributionsGte#1"),
        stamp: undefined,
      },
      Coinbase: {
        providerSpec: getProviderSpec("Coinbase", "Coinbase"),
        stamp: undefined,
      },
    },
    passportLoadResponse: undefined,
    handleAddStamps: jest.fn(),
    handlePatchStamps: jest.fn(),
    handleCreatePassport: jest.fn(),
    handleDeleteStamps: jest.fn(),
    expiredProviders: [],
    expiredPlatforms: {},
    passportHasCacaoError: false,
    cancelCeramicConnection: jest.fn(),
    verifiedProviderIds: [],
    verifiedPlatforms: {},
    ...initialState,
  };
};

export const makeTestClaimingContext = (
  initialState?: Partial<StampClaimingContextState>
): StampClaimingContextState => {
  return {
    claimCredentials: jest.fn(),
    ...initialState,
  };
};

export const scorerContext = {
  scoredPlatforms: [
    {
      icon: "./assets/gtcStakingLogoIcon.svg",
      platform: "GtcStaking",
      name: "GTC Staking",
      description: "Connect to passport to verify your staking amount.",
      connectMessage: "Verify amount",
      isEVM: true,
      possiblePoints: 7.4399999999999995,
      earnedPoints: 0,
    },
    {
      icon: "./assets/gtcGrantsLightIcon.svg",
      platform: "Gitcoin",
      name: "Gitcoin",
      description: "Connect with Github to verify with your Gitcoin account.",
      connectMessage: "Connect Account",
      isEVM: true,
      possiblePoints: 12.93,
      earnedPoints: 0,
    },
    {
      icon: "./assets/twitterStampIcon.svg",
      platform: "Twitter",
      name: "Twitter",
      description: "Connect your existing Twitter account to verify.",
      connectMessage: "Connect Account",
      possiblePoints: 3.63,
      earnedPoints: 3.63,
    },
    {
      icon: "./assets/discordStampIcon.svg",
      platform: "Discord",
      name: "Discord",
      description: "Connect your existing Discord account to verify.",
      connectMessage: "Connect Account",
      possiblePoints: 0.689,
      earnedPoints: 0,
    },
    {
      icon: "./assets/googleStampIcon.svg",
      platform: "Google",
      name: "Google",
      description: "Connect your existing Google Account to verify",
      connectMessage: "Connect Account",
      possiblePoints: 2.25,
      earnedPoints: 1,
    },
  ],
  rawScore: 0,
} as unknown as ScorerContextState;

export const renderWithContext = (
  userContext: UserContextState,
  ceramicContext: CeramicContextState,
  ui: React.ReactElement<any, string | React.JSXElementConstructor<any>>
) =>
  render(
    <ScorerContext.Provider value={scorerContext}>
      <UserContext.Provider value={userContext}>
        <CeramicContext.Provider value={ceramicContext}>{ui}</CeramicContext.Provider>
      </UserContext.Provider>
    </ScorerContext.Provider>
  );

export const testOnChainContextState = (initialState?: Partial<OnChainContextState>): OnChainContextState => {
  return {
    onChainProviders: {},
    activeChainProviders: [
      {
        providerName: "githubAccountCreationGte#90",
        credentialHash: "v0.0.0:rnutMGjNA2yPx/8xzJdn6sXDsY46lLUNV3DHAHoPJJg=",
        expirationDate: new Date("2090-07-31T11:49:51.433Z"),
        issuanceDate: new Date("2023-07-02T11:49:51.433Z"),
      },
      {
        providerName: "githubAccountCreationGte#180",
        credentialHash: "v0.0.0:rnutMGjNA2yPx/8xzJdn6sXDsY46lLUNV3DHAHoPJJg=",
        expirationDate: new Date("2090-07-31T11:49:51.433Z"),
        issuanceDate: new Date("2023-07-02T11:49:51.433Z"),
      },
      {
        providerName: "githubAccountCreationGte#365",
        credentialHash: "v0.0.0:rnutMGjNA2yPx/8xzJdn6sXDsY46lLUNV3DHAHoPJJg=",
        expirationDate: new Date("2090-07-31T11:49:51.433Z"),
        issuanceDate: new Date("2023-07-02T11:49:51.433Z"),
      },
    ],
    readOnChainData: jest.fn(),
    onChainScores: {},
    onChainLastUpdates: {},
  };
};
