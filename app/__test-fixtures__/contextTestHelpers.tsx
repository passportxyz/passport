import { ScorerContext, ScorerContextState } from "../context/scorerContext";
import { vi } from "vitest";
import { CeramicContext, CeramicContextState, IsLoadingPassportState } from "../context/ceramicContext";
import { platforms, ProviderSpec } from "@gitcoin/passport-platforms";
import React from "react";
import { render } from "@testing-library/react";
import { PLATFORM_ID } from "@gitcoin/passport-types";
import { PlatformProps } from "../components/GenericPlatform";
import { StampClaimingContextState, StampClaimProgressStatus } from "../context/stampClaimingContext";
import {
  DatastoreConnectionContext,
  DatastoreConnectionContextState,
  DbAuthTokenStatus,
} from "../context/datastoreConnectionContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { wagmiConfig } from "../utils/web3";

export const getProviderSpec = (platform: PLATFORM_ID, provider: string): ProviderSpec => {
  const platformDefinition = platforms[platform];
  return platformDefinition?.ProviderConfig?.find((i) => i.providers.find((p) => p.name == provider))?.providers.find(
    (p) => p.name == provider
  ) as ProviderSpec;
};

export const makeTestCeramicContext = (initialState?: Partial<CeramicContextState>): CeramicContextState => {
  return {
    databaseReady: false,
    database: initialState?.database,
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
        providerSpec: getProviderSpec("Google", "Google"),
        stamp: undefined,
      },
      Ens: {
        providerSpec: getProviderSpec("Ens", "Ens"),
        stamp: undefined,
      },
      Github: {
        providerSpec: getProviderSpec("Github", "githubContributionActivityGte#30"),
        stamp: undefined,
      },
      POAP: {
        providerSpec: getProviderSpec("POAP", "POAP"),
        stamp: undefined,
      },
      Brightid: {
        providerSpec: getProviderSpec("Brightid", "Brightid"),
        stamp: undefined,
      },
      Outdid: {
        providerSpec: getProviderSpec("Outdid", "Outdid"),
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
      CoinbaseDualVerification: {
        providerSpec: getProviderSpec("Coinbase", "CoinbaseDualVerification"),
        stamp: undefined,
      },
    },
    passportLoadResponse: undefined,
    handleAddStamps: vi.fn(),
    handlePatchStamps: vi.fn(),
    handleCreatePassport: vi.fn(),
    handleDeleteStamps: vi.fn(),
    expiredProviders: [],
    expiredPlatforms: {},
    passportHasCacaoError: false,
    cancelCeramicConnection: vi.fn(),
    verifiedProviderIds: [],
    verifiedPlatforms: {},
    platformExpirationDates: {},
    ...initialState,
  };
};

export const makeTestCeramicContextWithExpiredStamps = (
  initialState?: Partial<CeramicContextState>
): CeramicContextState => {
  let expiredPlatforms: Partial<Record<PLATFORM_ID, PlatformProps>> = {};

  expiredPlatforms["ETH"] = {
    platform: new platforms.ETH.ETHPlatform(),
    platFormGroupSpec: platforms.ETH.ProviderConfig,
  };

  return {
    ...makeTestCeramicContext(initialState),
    expiredPlatforms,
    expiredProviders: ["ETHScore#75"],
  };
};

export const makeTestClaimingContext = (
  initialState?: Partial<StampClaimingContextState>
): StampClaimingContextState => {
  return {
    claimCredentials: vi.fn(),
    status: StampClaimProgressStatus.Idle,
    ...initialState,
  };
};

export const scorerContext = {
  score: 0,
  rawScore: 0,
  threshold: 20,
  scoreDescription: "",
  scoreState: { status: "success" as const },
  scoredPlatforms: [
    {
      icon: "./assets/gtcStakingLogoIcon.svg",
      platform: "GtcStaking",
      name: "GTC Staking",
      description: "Connect to passport to verify your staking amount.",
      connectMessage: "Verify amount",
      isEVM: true,
      possiblePoints: 7.4399999999999995,
      displayPossiblePoints: 7.4399999999999995,
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
      displayPossiblePoints: 12.93,
      earnedPoints: 0,
    },
    {
      icon: "./assets/twitterStampIcon.svg",
      platform: "Twitter",
      name: "Twitter",
      description: "Connect your existing Twitter account to verify.",
      connectMessage: "Connect Account",
      possiblePoints: 3.63,
      displayPossiblePoints: 3.63,
      earnedPoints: 3.63,
    },
    {
      icon: "./assets/discordStampIcon.svg",
      platform: "Discord",
      name: "Discord",
      description: "Connect your existing Discord account to verify.",
      connectMessage: "Connect Account",
      possiblePoints: 0.689,
      displayPossiblePoints: 0.689,
      earnedPoints: 0,
    },
    {
      icon: "./assets/googleStampIcon.svg",
      platform: "Google",
      name: "Google",
      description: "Connect your existing Google Account to verify",
      connectMessage: "Connect Account",
      possiblePoints: 2.25,
      displayPossiblePoints: 2.25,
      earnedPoints: 1,
    },
  ],
  refreshScore: vi.fn(),
  fetchStampWeights: vi.fn(),
  stampWeights: {},
  stampScores: {},
  stampDedupStatus: {},
  passingScore: false,
} as ScorerContextState;

export const createWalletStoreMock = () => {
  const mockConnect = vi.fn();

  const mockWalletState = {
    address: "0x123",
    connect: mockConnect,
  };

  const walletStoreLibraryMock = {
    useWalletStore: (callback: (state: any) => any) => callback(mockWalletState),
  };

  return {
    walletStoreLibraryMock,
    mockConnect,
  };
};

const datastoreConnectionContext = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  dbAccessToken: "token",
  dbAccessTokenStatus: "connected" as DbAuthTokenStatus,
  did: vi.fn() as any,
  checkSessionIsValid: vi.fn().mockImplementation(() => true),
};

export const renderWithContext = (
  ceramicContext: CeramicContextState,
  ui: React.ReactElement<any, string | React.JSXElementConstructor<any>>,
  datastoreContextOverride: Partial<DatastoreConnectionContextState> = {},
  scorerContextOverride: Partial<ScorerContextState> = {}
) => {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        <DatastoreConnectionContext.Provider value={{ ...datastoreConnectionContext, ...datastoreContextOverride }}>
          <ScorerContext.Provider value={{ ...scorerContext, ...scorerContextOverride }}>
            <CeramicContext.Provider value={ceramicContext}>{ui}</CeramicContext.Provider>
          </ScorerContext.Provider>
        </DatastoreConnectionContext.Provider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};
