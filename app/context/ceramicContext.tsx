import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import {
  Passport,
  PassportLoadResponse,
  PassportLoadStatus,
  PLATFORM_ID,
  PROVIDER_ID,
  Stamp,
} from "@gitcoin/passport-types";
import { ProviderSpec, STAMP_PROVIDERS } from "../config/providers";
import { CeramicDatabase, PassportDatabase } from "@gitcoin/passport-database-client";
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
  Coinbase,
  Coinpassport,
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
  handleAddStamps: (stamps: Stamp[]) => Promise<void>;
  handleDeleteStamps: (providerIds: PROVIDER_ID[]) => Promise<void>;
  handleCheckRefreshPassport: () => Promise<boolean>;
  cancelCeramicConnection: () => void;
  userDid: string | undefined;
  expiredProviders: PROVIDER_ID[];
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
platforms.set("Coinbase", {
  platform: new Coinbase.CoinbasePlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_COINBASE_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_COINBASE_CALLBACK,
  }),
  platFormGroupSpec: Coinbase.CoinbaseProviderConfig,
});

export enum IsLoadingPassportState {
  Idle,
  Loading,
  LoadingFromCeramic,
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
  Coinpassport: {
    providerSpec: getProviderSpec("Coinpassport", "Coinpassport"),
    stamp: undefined,
  },
  CoinpassportOver18: {
    providerSpec: getProviderSpec("Coinpassport", "CoinpassportOver18"),
    stamp: undefined,
  },
  CoinpassportOver21: {
    providerSpec: getProviderSpec("Coinpassport", "CoinpassportOver21"),
    stamp: undefined,
  },
  CoinpassportCountry: {
    providerSpec: getProviderSpec("Coinpassport", "CoinpassportCountry"),
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
  Coinbase: {
    providerSpec: getProviderSpec("Coinbase", "Coinbase"),
    stamp: undefined,
  },
};

const startingState: CeramicContextState = {
  passport: undefined,
  isLoadingPassport: IsLoadingPassportState.Loading,
  allProvidersState: startingAllProvidersState,
  allPlatforms: platforms,
  handleCreatePassport: async () => {},
  handleAddStamps: async () => {},
  handleDeleteStamps: async () => {},
  handleCheckRefreshPassport: async () => false,
  passportHasCacaoError: () => false,
  cancelCeramicConnection: () => {},
  userDid: undefined,
  expiredProviders: [],
  passportLoadResponse: undefined,
};

const CERAMIC_TIMEOUT_MS = process.env.CERAMIC_TIMEOUT_MS || "10000";

export const CeramicContext = createContext(startingState);

export const CeramicContextProvider = ({ children }: { children: any }) => {
  const [allProvidersState, setAllProviderState] = useState(startingAllProvidersState);
  const resolveCancel = useRef<() => void>();
  const [ceramicClient, setCeramicClient] = useState<CeramicDatabase | undefined>(undefined);
  const [isLoadingPassport, setIsLoadingPassport] = useState<IsLoadingPassportState>(IsLoadingPassportState.Loading);
  const [passport, setPassport] = useState<Passport | undefined>(undefined);
  const [userDid, setUserDid] = useState<string | undefined>();
  const [expiredProviders, setExpiredProviders] = useState<PROVIDER_ID[]>([]);
  const [passportLoadResponse, setPassportLoadResponse] = useState<PassportLoadResponse | undefined>();
  const [viewerConnection] = useViewerConnection();
  const [database, setDatabase] = useState<PassportDatabase | undefined>(undefined);

  const { address, dbAccessToken, dbAccessTokenStatus } = useContext(UserContext);

  useEffect(() => {
    return () => {
      clearAllProvidersState();
      setCeramicClient(undefined);
      setDatabase(undefined);
      setPassport(undefined);
      setUserDid(undefined);
      setPassportLoadResponse(undefined);
    };
  }, [address]);

  useEffect((): void => {
    switch (viewerConnection.status) {
      case "idle": {
        setCeramicClient(undefined);
        setDatabase(undefined);
        break;
      }
      case "connecting": {
        setIsLoadingPassport(IsLoadingPassportState.Loading);
        break;
      }
      case "connected": {
        if (dbAccessTokenStatus === "failed") {
          setIsLoadingPassport(IsLoadingPassportState.FailedToConnect);
        } else if (dbAccessToken && address) {
          // Ceramic Network Connection
          const ceramicClientInstance = new CeramicDatabase(
            viewerConnection.selfID.did,
            process.env.NEXT_PUBLIC_CERAMIC_CLIENT_URL,
            undefined,
            datadogLogs.logger
          );
          setCeramicClient(ceramicClientInstance);
          setUserDid(ceramicClientInstance.did);
          // Ceramic cache db
          const databaseInstance = new PassportDatabase(
            process.env.NEXT_PUBLIC_CERAMIC_CACHE_ENDPOINT || "",
            address,
            dbAccessToken,
            datadogLogs.logger,
            viewerConnection.selfID.did
          );

          setDatabase(databaseInstance);
        }
        break;
      }
      case "failed": {
        console.log("failed to connect self id :(");
        setCeramicClient(undefined);
        setDatabase(undefined);
        break;
      }
      default:
        break;
    }
  }, [viewerConnection.status, address, dbAccessToken, dbAccessTokenStatus]);

  useEffect(() => {
    if (database && ceramicClient) {
      fetchPassport(database, false, true);
    }
  }, [database, ceramicClient]);

  const passportLoadSuccess = (
    database: CeramicDatabase | PassportDatabase,
    passport?: Passport,
    skipLoadingState?: boolean
  ): Passport => {
    const cleanedPassport = cleanPassport(passport, database) as Passport;
    hydrateAllProvidersState(cleanedPassport);
    setPassport(cleanedPassport);
    if (!skipLoadingState) setIsLoadingPassport(IsLoadingPassportState.Idle);
    return cleanedPassport;
  };

  const passportLoadException = (skipLoadingState?: boolean) => {
    datadogRum.addError("Exception when reading passport", { address });
    setPassport(undefined);
    if (!skipLoadingState) setIsLoadingPassport(IsLoadingPassportState.FailedToConnect);
  };

  const passportLoadDoesNotExist = async () => {
    try {
      await handleCreatePassport();
      // Start also fetching the passport from ceramic.
      // If we are creating passport, this will already call loadCeramicPassport,
      // so no need to call it again
      loadCeramicPassport();
    } catch (e) {
      return false;
    }
  };

  const fetchPassport = async (
    database: CeramicDatabase | PassportDatabase,
    skipLoadingState?: boolean,
    isInitialLoad?: boolean
  ): Promise<Passport | undefined> => {
    if (!skipLoadingState) setIsLoadingPassport(IsLoadingPassportState.Loading);

    // fetch, clean and set the new Passport state
    const { status, errorDetails, passport } = await database.getPassport();
    let passportToReturn: Passport | undefined = undefined;

    switch (status) {
      case "Success":
        passportToReturn = passportLoadSuccess(database, passport, skipLoadingState);
        break;
      case "StampCacaoError":
      case "PassportCacaoError":
        // These cannot occur when loading from DB
        break;
      case "DoesNotExist":
        if (isInitialLoad) {
          await passportLoadDoesNotExist();
        }
        break;
      case "ExceptionRaised":
        // something is wrong with Ceramic...
        passportLoadException(skipLoadingState);
        break;
    }

    setPassportLoadResponse({ passport, status, errorDetails });
    return passportToReturn;
  };

  const cleanPassport = (
    passport: Passport | undefined | false,
    database: CeramicDatabase | PassportDatabase
  ): Passport | undefined | false => {
    const tempExpiredProviders: PROVIDER_ID[] = [];
    // clean stamp content if expired or from a different issuer
    if (passport) {
      passport.stamps = passport.stamps.filter((stamp: Stamp) => {
        if (stamp) {
          const has_expired = new Date(stamp.credential.expirationDate) < new Date();
          if (has_expired) {
            tempExpiredProviders.push(stamp.credential.credentialSubject.provider as PROVIDER_ID);
          }

          const has_correct_issuer = stamp.credential.issuer === IAM_ISSUER_DID;
          const has_correct_subject = stamp.credential.credentialSubject.id.toLowerCase() === database.did;

          return !has_expired && has_correct_issuer && has_correct_subject;
        } else {
          return false;
        }
      });
      setExpiredProviders(tempExpiredProviders);
    }

    return passport;
  };

  const handleCheckRefreshPassport = async (): Promise<boolean> => {
    let success = true;
    if (ceramicClient && passportLoadResponse) {
      let passportHasError = passportLoadResponse.status === "PassportCacaoError";
      let failedStamps = passportLoadResponse.errorDetails?.stampStreamIds || [];
      try {
        if (passportHasError) {
          passportHasError = !(await ceramicClient.refreshPassport());
        }

        if (failedStamps && failedStamps.length) {
          try {
            await ceramicClient.deleteStampIDs(failedStamps);
            failedStamps = [];
          } catch {}
        }

        // fetchPassport to reset passport state
        await fetchPassport(ceramicClient);

        success = !passportHasError && !failedStamps.length;
      } catch {
        success = false;
      }
    }
    return success;
  };

  // Start also fetching the passport from ceramic.
  // We only do this to asses the "health" of the Passport & Stamps
  // In case of erros we will force a reset of the Pasport.
  // In case of borked stamps, we will not reset those, we'll simply ignore the borked stamps
  // and the user ca claim other stamps
  const loadCeramicPassport = async (): Promise<PassportLoadResponse> => {
    if (ceramicClient) {
      const ret = await ceramicClient.getPassport();
      switch (ret.status) {
        case "Success":
          // Ok, nothing to do for now
          break;
        case "StampCacaoError":
          // Ok, nothing to do for now. We will ignore borked stamps
          break;
        case "PassportCacaoError":
          // We need to reset the passport to the last stable state
          datadogRum.addError(
            "Passport CACAO error -- error thrown on initial fetch. Going to refresh passport with SyncOptions.SYNC_ALWAYS option",
            { address }
          );
          await ceramicClient.refreshPassport();
          break;
        case "DoesNotExist":
          // Ok, nothing to do for now
          break;
        case "ExceptionRaised":
          // Ok, nothing to do for now
          break;
      }
      return ret;
    }
    // We just return an error here
    return { status: "ExceptionRaised", passport: undefined };
  };

  const handleCreatePassport = async (): Promise<void> => {
    if (database && ceramicClient) {
      setIsLoadingPassport(IsLoadingPassportState.LoadingFromCeramic);

      let initialStamps: Stamp[] = [];

      try {
        const { status, passport } = await Promise.race<PassportLoadResponse>([
          returnEmptyPassportAfterTimeout(parseInt(CERAMIC_TIMEOUT_MS)),
          returnEmptyPassportOnCancel(),
          loadCeramicPassport(),
        ]);
        if (status === "Success" && passport?.stamps.length) {
          initialStamps = passport.stamps;
        }
      } catch (e) {
        console.error(e);
      }

      await database.createPassport(initialStamps);
      await fetchPassport(database);
    }
  };

  const cancelCeramicConnection = () => {
    if (resolveCancel?.current) resolveCancel.current();
  };

  const returnEmptyPassportOnCancel = async (): Promise<PassportLoadResponse> =>
    new Promise<PassportLoadResponse>((resolve) => {
      resolveCancel.current = () => {
        resolve({ status: "Success", passport: { stamps: [] } });
      };
    });

  const returnEmptyPassportAfterTimeout = async (timeout: number): Promise<PassportLoadResponse> =>
    new Promise<PassportLoadResponse>((resolve) =>
      setTimeout(() => resolve({ status: "Success", passport: { stamps: [] } }), timeout)
    );

  const handleAddStamps = async (stamps: Stamp[]): Promise<void> => {
    try {
      if (database) {
        await database.addStamps(stamps);
        const newPassport = await fetchPassport(database, true);
        if (ceramicClient && newPassport) {
          ceramicClient.setStamps(newPassport.stamps);
        }
      }
    } catch (e) {
      datadogLogs.logger.error("Error adding multiple stamps", { stamps, error: e });
      throw e;
    }
  };

  const handleDeleteStamps = async (providerIds: PROVIDER_ID[]): Promise<void> => {
    try {
      if (database) {
        await database.deleteStamps(providerIds);

        const newPassport = await fetchPassport(database, true);
        if (ceramicClient && newPassport) {
          ceramicClient.setStamps(newPassport.stamps);
        }
      }
    } catch (e) {
      datadogLogs.logger.error("Error deleting multiple stamps", { providerIds, error: e });
      throw e;
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
      handleAddStamps,
      handleDeleteStamps,
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
    handleAddStamps,
    handleDeleteStamps,
    handleCheckRefreshPassport,
    cancelCeramicConnection,
    userDid,
    expiredProviders,
    passportLoadResponse,
    passportHasCacaoError,
  };

  return <CeramicContext.Provider value={providerProps}>{children}</CeramicContext.Provider>;
};
