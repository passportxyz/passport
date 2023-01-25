import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  Passport,
  PassportLoadResponse,
  PassportLoadStatus,
  PLATFORM_ID,
  PROVIDER_ID,
  Stamp,
} from "@gitcoin/passport-types";
import { ProviderSpec, STAMP_PROVIDERS } from "../config/providers";
import { CeramicDatabase } from "@gitcoin/passport-database-client";
import { useViewerConnection } from "@self.id/framework";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { UserContext } from "./userContext";
import {
  Twitter,
  Ens,
  Lens,
  Github,
  Gitcoin,
  Facebook,
  Poh,
  GitPOAP,
  NFT,
  GnosisSafe,
  Snapshot,
  POAP,
  ETH,
  ZkSync,
  Discord,
  Linkedin,
  GTC,
  GtcStaking,
  Google,
  Brightid,
} from "@gitcoin/passport-platforms";
import { PlatformProps } from "../components/GenericPlatform";

// -- Trusted IAM servers DID
const IAM_ISSUER_DID = process.env.NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID || "";

export interface CeramicContextState {
  passport: Passport | undefined | false;
  isLoadingPassport: IsLoadingPassportState;
  allProvidersState: AllProvidersState;
  allPlatforms: Map<PLATFORM_ID, PlatformProps>;
  handleCreatePassport: () => Promise<void>;
  handleAddStamp: (stamp: Stamp) => Promise<void>;
  handleAddStamps: (stamps: Stamp[]) => Promise<void>;
  handleDeleteStamp: (streamId: string) => Promise<void>;
  handleDeleteStamps: (providerIds: PROVIDER_ID[]) => Promise<void>;
  handleCheckRefreshPassport: () => Promise<boolean>;
  userDid: string | undefined;
  passportHasCacaoError: () => boolean;
  passportLoadResponse?: PassportLoadResponse;
}

export const platforms = new Map<PLATFORM_ID, PlatformProps>();
platforms.set("Twitter", {
  platform: new Twitter.TwitterPlatform(),
  platFormGroupSpec: Twitter.TwitterProviderConfig,
});

platforms.set("GitPOAP", {
  platform: new GitPOAP.GitPOAPPlatform(),
  platFormGroupSpec: GitPOAP.GitPOAPProviderConfig,
});

platforms.set("Ens", {
  platform: new Ens.EnsPlatform(),
  platFormGroupSpec: Ens.EnsProviderConfig,
});

platforms.set("NFT", {
  platform: new NFT.NFTPlatform(),
  platFormGroupSpec: NFT.NFTProviderConfig,
});

platforms.set("Facebook", {
  platFormGroupSpec: Facebook.FacebookProviderConfig,
  platform: new Facebook.FacebookPlatform(),
});

platforms.set("Github", {
  platform: new Github.GithubPlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CALLBACK,
  }),
  platFormGroupSpec: Github.GithubProviderConfig,
});

platforms.set("Gitcoin", {
  platform: new Gitcoin.GitcoinPlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CALLBACK,
  }),
  platFormGroupSpec: Gitcoin.GitcoinProviderConfig,
});

platforms.set("Snapshot", {
  platform: new Snapshot.SnapshotPlatform(),
  platFormGroupSpec: Snapshot.SnapshotProviderConfig,
});

platforms.set("Poh", {
  platform: new Poh.PohPlatform(),
  platFormGroupSpec: Poh.PohProviderConfig,
});

platforms.set("ZkSync", {
  platform: new ZkSync.ZkSyncPlatform(),
  platFormGroupSpec: ZkSync.ZkSyncProviderConfig,
});

platforms.set("Lens", {
  platform: new Lens.LensPlatform(),
  platFormGroupSpec: Lens.LensProviderConfig,
});

platforms.set("GnosisSafe", {
  platform: new GnosisSafe.GnosisSafePlatform(),
  platFormGroupSpec: GnosisSafe.GnosisSafeProviderConfig,
});

platforms.set("ETH", {
  platform: new ETH.ETHPlatform(),
  platFormGroupSpec: ETH.ETHProviderConfig,
});

platforms.set("POAP", {
  platform: new POAP.POAPPlatform(),
  platFormGroupSpec: POAP.POAPProviderConfig,
});

platforms.set("Discord", {
  platform: new Discord.DiscordPlatform(),
  platFormGroupSpec: Discord.DiscordProviderConfig,
});

platforms.set("Linkedin", {
  platform: new Linkedin.LinkedinPlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_LINKEDIN_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_LINKEDIN_CALLBACK,
  }),
  platFormGroupSpec: Linkedin.LinkedinProviderConfig,
});

platforms.set("GTC", {
  platform: new GTC.GTCPlatform(),
  platFormGroupSpec: GTC.GTCProviderConfig,
});

platforms.set("GtcStaking", {
  platform: new GtcStaking.GTCStakingPlatform(),
  platFormGroupSpec: GtcStaking.GTCStakingProviderConfig,
});

platforms.set("Google", {
  platform: new Google.GooglePlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_GOOGLE_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_GOOGLE_CALLBACK,
  }),
  platFormGroupSpec: Google.GoogleProviderConfig,
});

platforms.set("Brightid", {
  platform: new Brightid.BrightidPlatform(),
  platFormGroupSpec: Brightid.BrightidProviderConfig,
});

export enum IsLoadingPassportState {
  Idle,
  Loading,
  FailedToConnect,
}

export type AllProvidersState = {
  [provider in PROVIDER_ID]?: {
    providerSpec: ProviderSpec;
    stamp?: Stamp;
  };
};

const getProviderSpec = (platform: PLATFORM_ID, provider: string): ProviderSpec => {
  return STAMP_PROVIDERS[platform]
    ?.find((i) => i.providers.find((p) => p.name == provider))
    ?.providers.find((p) => p.name == provider) as ProviderSpec;
};

const startingAllProvidersState: AllProvidersState = {
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
  FacebookFriends: {
    providerSpec: getProviderSpec("Facebook", "FacebookFriends"),
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
  Github: {
    providerSpec: getProviderSpec("Github", "Github"),
    stamp: undefined,
  },
  TenOrMoreGithubFollowers: {
    providerSpec: getProviderSpec("Github", "TenOrMoreGithubFollowers"),
    stamp: undefined,
  },
  FiftyOrMoreGithubFollowers: {
    providerSpec: getProviderSpec("Github", "FiftyOrMoreGithubFollowers"),
    stamp: undefined,
  },
  ForkedGithubRepoProvider: {
    providerSpec: getProviderSpec("Github", "ForkedGithubRepoProvider"),
    stamp: undefined,
  },
  StarredGithubRepoProvider: {
    providerSpec: getProviderSpec("Github", "StarredGithubRepoProvider"),
    stamp: undefined,
  },
  FiveOrMoreGithubRepos: {
    providerSpec: getProviderSpec("Github", "FiveOrMoreGithubRepos"),
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
  Snapshot: {
    providerSpec: getProviderSpec("Snapshot", "Snapshot"),
    stamp: undefined,
  },
  SnapshotProposalsProvider: {
    providerSpec: getProviderSpec("Snapshot", "SnapshotProposalsProvider"),
    stamp: undefined,
  },
  SnapshotVotesProvider: {
    providerSpec: getProviderSpec("Snapshot", "SnapshotVotesProvider"),
    stamp: undefined,
  },
  "ethPossessionsGte#1": {
    providerSpec: getProviderSpec("ETH", "ethPossessionsGte#1"),
    stamp: undefined,
  },
  "ethPossessionsGte#10": {
    providerSpec: getProviderSpec("ETH", "ethPossessionsGte#10"),
    stamp: undefined,
  },
  "ethPossessionsGte#32": {
    providerSpec: getProviderSpec("ETH", "ethPossessionsGte#32"),
    stamp: undefined,
  },
  FirstEthTxnProvider: {
    providerSpec: getProviderSpec("ETH", "FirstEthTxnProvider"),
    stamp: undefined,
  },
  EthGTEOneTxnProvider: {
    providerSpec: getProviderSpec("ETH", "EthGTEOneTxnProvider"),
    stamp: undefined,
  },
  EthGasProvider: {
    providerSpec: getProviderSpec("ETH", "EthGasProvider"),
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
  "GitcoinGranteeStatistics#numOwnedGrants#1": {
    providerSpec: getProviderSpec("Gitcoin", "GitcoinGranteeStatistics#numOwnedGrants#1"),
    stamp: undefined,
  },
  "GitcoinGranteeStatistics#numGrantContributors#10": {
    providerSpec: getProviderSpec("Gitcoin", "GitcoinGranteeStatistics#numGrantContributors#10"),
    stamp: undefined,
  },
  "GitcoinGranteeStatistics#numGrantContributors#25": {
    providerSpec: getProviderSpec("Gitcoin", "GitcoinGranteeStatistics#numGrantContributors#25"),
    stamp: undefined,
  },
  "GitcoinGranteeStatistics#numGrantContributors#100": {
    providerSpec: getProviderSpec("Gitcoin", "GitcoinGranteeStatistics#numGrantContributors#100"),
    stamp: undefined,
  },
  "GitcoinGranteeStatistics#totalContributionAmount#100": {
    providerSpec: getProviderSpec("Gitcoin", "GitcoinGranteeStatistics#totalContributionAmount#100"),
    stamp: undefined,
  },
  "GitcoinGranteeStatistics#totalContributionAmount#1000": {
    providerSpec: getProviderSpec("Gitcoin", "GitcoinGranteeStatistics#totalContributionAmount#1000"),
    stamp: undefined,
  },
  "GitcoinGranteeStatistics#totalContributionAmount#10000": {
    providerSpec: getProviderSpec("Gitcoin", "GitcoinGranteeStatistics#totalContributionAmount#10000"),
    stamp: undefined,
  },
  "GitcoinGranteeStatistics#numGrantsInEcoAndCauseRound#1": {
    providerSpec: getProviderSpec("Gitcoin", "GitcoinGranteeStatistics#numGrantsInEcoAndCauseRound#1"),
    stamp: undefined,
  },
  "gtcPossessionsGte#10": {
    providerSpec: getProviderSpec("GTC", "gtcPossessionsGte#10"),
    stamp: undefined,
  },
  "gtcPossessionsGte#100": {
    providerSpec: getProviderSpec("GTC", "gtcPossessionsGte#100"),
  },
  SelfStakingBronze: {
    providerSpec: getProviderSpec("GtcStaking", "SelfStakingBronze"),
    stamp: undefined,
  },
  SelfStakingSilver: {
    providerSpec: getProviderSpec("GtcStaking", "SelfStakingSilver"),
    stamp: undefined,
  },
  SelfStakingGold: {
    providerSpec: getProviderSpec("GtcStaking", "SelfStakingGold"),
    stamp: undefined,
  },
  CommunityStakingBronze: {
    providerSpec: getProviderSpec("GtcStaking", "CommunityStakingBronze"),
    stamp: undefined,
  },
  CommunityStakingSilver: {
    providerSpec: getProviderSpec("GtcStaking", "CommunityStakingSilver"),
    stamp: undefined,
  },
  CommunityStakingGold: {
    providerSpec: getProviderSpec("GtcStaking", "CommunityStakingGold"),
    stamp: undefined,
  },
  NFT: {
    providerSpec: getProviderSpec("NFT", "NFT"),
    stamp: undefined,
  },
  ZkSync: {
    providerSpec: getProviderSpec("ZkSync", "ZkSync"),
    stamp: undefined,
  },
  Lens: {
    providerSpec: getProviderSpec("Lens", "Lens"),
    stamp: undefined,
  },
  GnosisSafe: {
    providerSpec: getProviderSpec("GnosisSafe", "GnosisSafe"),
    stamp: undefined,
  },
};

const startingState: CeramicContextState = {
  passport: undefined,
  isLoadingPassport: IsLoadingPassportState.Loading,
  allProvidersState: startingAllProvidersState,
  allPlatforms: platforms,
  handleCreatePassport: async () => {},
  handleAddStamp: async () => {},
  handleAddStamps: async () => {},
  handleDeleteStamp: async (streamId: string) => {},
  handleDeleteStamps: async () => {},
  handleCheckRefreshPassport: async () => false,
  passportHasCacaoError: () => false,
  userDid: undefined,
  passportLoadResponse: undefined,
};

export const CeramicContext = createContext(startingState);

export const CeramicContextProvider = ({ children }: { children: any }) => {
  const [allProvidersState, setAllProviderState] = useState(startingAllProvidersState);
  const [ceramicDatabase, setCeramicDatabase] = useState<CeramicDatabase | undefined>(undefined);
  const [isLoadingPassport, setIsLoadingPassport] = useState<IsLoadingPassportState>(IsLoadingPassportState.Loading);
  const [passport, setPassport] = useState<Passport | undefined>(undefined);
  const [userDid, setUserDid] = useState<string | undefined>();
  const [passportLoadResponse, setPassportLoadResponse] = useState<PassportLoadResponse | undefined>();
  const [viewerConnection] = useViewerConnection();

  const { address } = useContext(UserContext);

  useEffect(() => {
    return () => {
      clearAllProvidersState();
      setCeramicDatabase(undefined);
      setPassport(undefined);
      setUserDid(undefined);
      setPassportLoadResponse(undefined);
    };
  }, [address]);

  useEffect((): void => {
    switch (viewerConnection.status) {
      case "idle": {
        setCeramicDatabase(undefined);
        break;
      }
      case "connected": {
        const ceramicDatabaseInstance = new CeramicDatabase(
          viewerConnection.selfID.did,
          process.env.NEXT_PUBLIC_CERAMIC_CLIENT_URL,
          undefined,
          datadogLogs.logger
        );
        setCeramicDatabase(ceramicDatabaseInstance);
        setUserDid(ceramicDatabaseInstance.did);
        break;
      }
      case "failed": {
        console.log("failed to connect self id :(");
        setCeramicDatabase(undefined);
        break;
      }
      default:
        break;
    }
  }, [viewerConnection.status]);

  useEffect(() => {
    if (ceramicDatabase) {
      fetchPassport(ceramicDatabase);
    }
  }, [ceramicDatabase]);

  const fetchPassport = async (database: CeramicDatabase, skipLoadingState?: boolean): Promise<void> => {
    if (!skipLoadingState) setIsLoadingPassport(IsLoadingPassportState.Loading);

    // fetch, clean and set the new Passport state
    const { status, errorDetails, passport } = await database.getPassport();

    switch (status) {
      case "Success":
      case "StampCacaoError":
        const cleanedPassport = cleanPassport(passport, database) as Passport;
        hydrateAllProvidersState(cleanedPassport);
        setPassport(cleanedPassport);
        if (!skipLoadingState) setIsLoadingPassport(IsLoadingPassportState.Idle);
        break;
      case "PassportCacaoError":
        datadogRum.addError("Passport CACAO error -- error thrown on initial fetch", { address });
        break;
      case "DoesNotExist":
        handleCreatePassport();
        break;
      case "ExceptionRaised":
        // something is wrong with Ceramic...
        datadogRum.addError("Ceramic connection failed", { address });
        setPassport(undefined);
        if (!skipLoadingState) setIsLoadingPassport(IsLoadingPassportState.FailedToConnect);
        break;
    }

    setPassportLoadResponse({ passport, status, errorDetails });
  };

  const cleanPassport = (
    passport: Passport | undefined | false,
    database: CeramicDatabase
  ): Passport | undefined | false => {
    // clean stamp content if expired or from a different issuer
    if (passport) {
      passport.stamps = passport.stamps.filter((stamp: Stamp) => {
        if (stamp) {
          const has_expired = new Date(stamp.credential.expirationDate) < new Date();
          const has_correct_issuer = stamp.credential.issuer === IAM_ISSUER_DID;
          const has_correct_subject = stamp.credential.credentialSubject.id.toLowerCase() === database.did;

          return !has_expired && has_correct_issuer && has_correct_subject;
        } else {
          return false;
        }
      });
    }

    return passport;
  };

  const handleCheckRefreshPassport = async (): Promise<boolean> => {
    let success = true;
    if (ceramicDatabase && passportLoadResponse) {
      let passportHasError = passportLoadResponse.status === "PassportCacaoError";
      let failedStamps = passportLoadResponse.errorDetails?.stampStreamIds || [];
      try {
        if (passportHasError) {
          passportHasError = !(await ceramicDatabase.refreshPassport());
        }

        if (failedStamps && failedStamps.length) {
          try {
            await ceramicDatabase.deleteStampIDs(failedStamps);
            failedStamps = [];
          } catch {}
        }

        // fetchPassport to reset passport state
        await fetchPassport(ceramicDatabase);

        success = !passportHasError && !failedStamps.length;
      } catch {
        success = false;
      }
    }
    return success;
  };

  const handleCreatePassport = async (): Promise<void> => {
    if (ceramicDatabase) {
      await ceramicDatabase.createPassport();
      await fetchPassport(ceramicDatabase);
    }
  };

  const handleAddStamp = async (stamp: Stamp): Promise<void> => {
    if (ceramicDatabase) {
      await ceramicDatabase.addStamp(stamp);
      await fetchPassport(ceramicDatabase, true);
    }
  };

  const handleAddStamps = async (stamps: Stamp[]): Promise<void> => {
    if (ceramicDatabase) {
      await ceramicDatabase.addStamps(stamps);
      await fetchPassport(ceramicDatabase, true);
    }
  };

  const handleDeleteStamps = async (providerIds: PROVIDER_ID[]): Promise<void> => {
    if (ceramicDatabase) {
      await ceramicDatabase.deleteStamps(providerIds);
      await fetchPassport(ceramicDatabase, true);
    }
  };

  const handleDeleteStamp = async (streamId: string): Promise<void> => {
    if (ceramicDatabase) {
      await ceramicDatabase.deleteStamp(streamId);
      await new Promise((r) =>
        // We need to delay the loading of stamps, in order for the deletion to be reflected in ceramic
        setTimeout(async () => {
          await fetchPassport(ceramicDatabase, true);
          r(0);
        }, 2000)
      );
    }
  };

  const hydrateAllProvidersState = (passport?: Passport) => {
    if (passport) {
      // set stamps into allProvidersState
      let newAllProviderState = { ...startingAllProvidersState };
      passport.stamps.forEach((stamp: Stamp) => {
        const { provider } = stamp;
        const providerState = allProvidersState[provider];
        if (providerState) {
          const newProviderState = {
            providerSpec: providerState.providerSpec,
            stamp,
          };
          newAllProviderState[provider] = newProviderState;
        }
      });
      setAllProviderState(newAllProviderState);
    } else {
      clearAllProvidersState();
    }
  };

  const clearAllProvidersState = () => {
    setAllProviderState(startingAllProvidersState);
  };

  const passportHasCacaoError = (): boolean => {
    const errorStatuses: PassportLoadStatus[] = ["PassportCacaoError", "StampCacaoError"];
    if (passportLoadResponse) return errorStatuses.includes(passportLoadResponse.status);
    else return false;
  };

  const stateMemo = useMemo(
    () => ({
      passport,
      isLoadingPassport,
      allProvidersState,
      handleCreatePassport,
      handleAddStamp,
      handleAddStamps,
      handleDeleteStamps,
      handleDeleteStamp,
      userDid,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [passport, isLoadingPassport, allProvidersState, userDid]
  );

  const providerProps = {
    passport,
    isLoadingPassport,
    allProvidersState,
    allPlatforms: platforms,
    handleCreatePassport,
    handleAddStamp,
    handleAddStamps,
    handleDeleteStamps,
    handleDeleteStamp,
    handleCheckRefreshPassport,
    userDid,
    passportLoadResponse,
    passportHasCacaoError,
  };

  return <CeramicContext.Provider value={providerProps}>{children}</CeramicContext.Provider>;
};
