import { createContext, useContext, useEffect, useMemo, useState, useRef } from "react";
import {
  Passport,
  PassportLoadResponse,
  PassportLoadStatus,
  PLATFORM_ID,
  PROVIDER_ID,
  Stamp,
  StampPatch,
} from "@gitcoin/passport-types";
import { ProviderSpec } from "../config/providers";
import { CeramicDatabase, PassportDatabase } from "@gitcoin/passport-database-client";
import { useViewerConnection } from "@self.id/framework";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { UserContext } from "./userContext";
import { ScorerContext } from "./scorerContext";

import { PlatformGroupSpec, platforms as stampPlatforms } from "@gitcoin/passport-platforms";
const {
  Twitter,
  Ens,
  Lens,
  Github,
  Gitcoin,
  Facebook,
  Poh,
  PHI,
  GitPOAP,
  NFT,
  GnosisSafe,
  Snapshot,
  POAP,
  ETH,
  ZkSync,
  Discord,
  Linkedin,
  GtcStaking,
  Google,
  Brightid,
  Coinbase,
  GuildXYZ,
  Hypercerts,
  Holonym,
  Idena,
  Civic,
  CyberConnect,
} = stampPlatforms;
import { PlatformProps } from "../components/GenericPlatform";

// -- Trusted IAM servers DID
const IAM_ISSUER_DID = process.env.NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID || "";
const CACAO_ERROR_STATUSES: PassportLoadStatus[] = ["PassportCacaoError", "StampCacaoError"];

export interface CeramicContextState {
  passport: Passport | undefined | false;
  isLoadingPassport: IsLoadingPassportState;
  allProvidersState: AllProvidersState;
  allPlatforms: Map<PLATFORM_ID, PlatformProps>;
  handleCreatePassport: () => Promise<void>;
  handleAddStamps: (stamps: Stamp[]) => Promise<void>;
  handlePatchStamps: (stamps: StampPatch[]) => Promise<void>;
  handleDeleteStamps: (providerIds: PROVIDER_ID[]) => Promise<void>;
  handleCheckRefreshPassport: () => Promise<boolean>;
  cancelCeramicConnection: () => void;
  userDid: string | undefined;
  expiredProviders: PROVIDER_ID[];
  passportHasCacaoError: boolean;
  passportLoadResponse?: PassportLoadResponse;
}

export const platforms = new Map<PLATFORM_ID, PlatformProps>();
platforms.set("Twitter", {
  platform: new Twitter.TwitterPlatform(),
  platFormGroupSpec: Twitter.ProviderConfig,
});

platforms.set("GitPOAP", {
  platform: new GitPOAP.GitPOAPPlatform(),
  platFormGroupSpec: GitPOAP.ProviderConfig,
});

platforms.set("Ens", {
  platform: new Ens.EnsPlatform(),
  platFormGroupSpec: Ens.ProviderConfig,
});

platforms.set("NFT", {
  platform: new NFT.NFTPlatform(),
  platFormGroupSpec: NFT.ProviderConfig,
});

platforms.set("Facebook", {
  platform: new Facebook.FacebookPlatform(),
  platFormGroupSpec: Facebook.ProviderConfig,
});

platforms.set("Github", {
  platform: new Github.GithubPlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CALLBACK,
  }),
  platFormGroupSpec: Github.ProviderConfig,
});

platforms.set("Gitcoin", {
  platform: new Gitcoin.GitcoinPlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CALLBACK,
  }),
  platFormGroupSpec: Gitcoin.ProviderConfig,
});

platforms.set("Snapshot", {
  platform: new Snapshot.SnapshotPlatform(),
  platFormGroupSpec: Snapshot.ProviderConfig,
});

platforms.set("Poh", {
  platform: new Poh.PohPlatform(),
  platFormGroupSpec: Poh.ProviderConfig,
});

platforms.set("ZkSync", {
  platform: new ZkSync.ZkSyncPlatform(),
  platFormGroupSpec: ZkSync.ProviderConfig,
});

platforms.set("Lens", {
  platform: new Lens.LensPlatform(),
  platFormGroupSpec: Lens.ProviderConfig,
});

platforms.set("GnosisSafe", {
  platform: new GnosisSafe.GnosisSafePlatform(),
  platFormGroupSpec: GnosisSafe.ProviderConfig,
});

platforms.set("ETH", {
  platform: new ETH.ETHPlatform(),
  platFormGroupSpec: ETH.ProviderConfig,
});

if (process.env.NEXT_PUBLIC_FF_NEW_POAP_STAMPS === "on") {
  platforms.set("POAP", {
    platform: new POAP.POAPPlatform(),
    platFormGroupSpec: POAP.ProviderConfig,
  });
}

platforms.set("Discord", {
  platform: new Discord.DiscordPlatform(),
  platFormGroupSpec: Discord.ProviderConfig,
});

platforms.set("Linkedin", {
  platform: new Linkedin.LinkedinPlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_LINKEDIN_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_LINKEDIN_CALLBACK,
  }),
  platFormGroupSpec: Linkedin.ProviderConfig,
});

platforms.set("GtcStaking", {
  platform: new GtcStaking.GTCStakingPlatform(),
  platFormGroupSpec: GtcStaking.ProviderConfig,
});

platforms.set("Google", {
  platform: new Google.GooglePlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_GOOGLE_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_GOOGLE_CALLBACK,
  }),
  platFormGroupSpec: Google.ProviderConfig,
});

platforms.set("Brightid", {
  platform: new Brightid.BrightidPlatform(),
  platFormGroupSpec: Brightid.ProviderConfig,
});
platforms.set("Coinbase", {
  platform: new Coinbase.CoinbasePlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_COINBASE_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_COINBASE_CALLBACK,
  }),
  platFormGroupSpec: Coinbase.ProviderConfig,
});

if (process.env.NEXT_PUBLIC_FF_HYPERCERT_STAMP === "on") {
  platforms.set("Hypercerts", {
    platform: new Hypercerts.HypercertsPlatform(),
    platFormGroupSpec: Hypercerts.ProviderConfig,
  });
}

if (process.env.NEXT_PUBLIC_FF_GUILD_STAMP === "on") {
  platforms.set("GuildXYZ", {
    platform: new GuildXYZ.GuildXYZPlatform(),
    platFormGroupSpec: GuildXYZ.ProviderConfig,
  });
}

if (process.env.NEXT_PUBLIC_FF_PHI_STAMP === "on") {
  platforms.set("PHI", {
    platform: new PHI.PHIPlatform(),
    platFormGroupSpec: PHI.ProviderConfig,
  });
}

if (process.env.NEXT_PUBLIC_FF_HOLONYM_STAMP === "on") {
  platforms.set("Holonym", {
    platform: new Holonym.HolonymPlatform(),
    platFormGroupSpec: Holonym.ProviderConfig,
  });
}

if (process.env.NEXT_PUBLIC_FF_IDENA_STAMP === "on") {
  platforms.set("Idena", {
    platform: new Idena.IdenaPlatform(),
    platFormGroupSpec: Idena.ProviderConfig,
  });
}

platforms.set("Civic", {
  platform: new Civic.CivicPlatform({
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_CIVIC_CALLBACK,
  }),
  platFormGroupSpec: Civic.ProviderConfig,
});

if (process.env.NEXT_PUBLIC_FF_CYBERCONNECT_STAMPS === "on") {
  platforms.set("CyberConnect", {
    platform: new CyberConnect.CyberConnectPlatform(),
    platFormGroupSpec: CyberConnect.ProviderConfig,
  });
}

export enum IsLoadingPassportState {
  Idle,
  Loading,
  LoadingFromCeramic,
  FailedToConnect,
}

export type ProviderState = {
  providerSpec: ProviderSpec;
  stamp?: Stamp;
};

export type AllProvidersState = {
  [provider in PROVIDER_ID]?: ProviderState;
};

// Generate {<stampName>: {providerSpec, stamp}} for all stamps
const startingAllProvidersState: AllProvidersState = Object.values(stampPlatforms).reduce(
  (allProvidersState, platform) => {
    const platformGroupSpecs: PlatformGroupSpec[] = platform.ProviderConfig;
    const platformProviderSpecs: ProviderSpec[] = platformGroupSpecs.map(({ providers }) => providers).flat();

    const platformProvidersState: AllProvidersState = platformProviderSpecs.reduce(
      (providerState, providerSpec) => ({
        ...providerState,
        [providerSpec.name]: {
          providerSpec,
          stamp: undefined,
        },
      }),
      {}
    );

    return {
      ...allProvidersState,
      ...platformProvidersState,
    };
  },
  {}
);

const startingState: CeramicContextState = {
  passport: undefined,
  isLoadingPassport: IsLoadingPassportState.Loading,
  allProvidersState: startingAllProvidersState,
  allPlatforms: platforms,
  handleCreatePassport: async () => {},
  handleAddStamps: async () => {},
  handlePatchStamps: async () => {},
  handleDeleteStamps: async () => {},
  handleCheckRefreshPassport: async () => false,
  passportHasCacaoError: false,
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
  const [passportHasCacaoError, setPassportHasCacaoError] = useState<boolean>(false);
  const [viewerConnection] = useViewerConnection();
  const [database, setDatabase] = useState<PassportDatabase | undefined>(undefined);

  const { address, dbAccessToken, dbAccessTokenStatus } = useContext(UserContext);
  const { refreshScore } = useContext(ScorerContext);

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
    setPassportHasCacaoError(CACAO_ERROR_STATUSES.includes(status));

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
          ceramicClient.setStamps(newPassport.stamps).catch((e) => console.log("error setting ceramic stamps", e));
        }
        if (dbAccessToken) {
          refreshScore(address, dbAccessToken);
        }
      }
    } catch (e) {
      datadogLogs.logger.error("Error adding multiple stamps", { stamps, error: e });
      throw e;
    }
  };

  const handlePatchStamps = async (stampPatches: StampPatch[]): Promise<void> => {
    try {
      if (database) {
        await database.patchStamps(stampPatches);
        const newPassport = await fetchPassport(database, true);

        if (ceramicClient && newPassport) {
          (async () => {
            try {
              const deleteProviderIds = stampPatches
                .filter(({ credential }) => !credential)
                .map(({ provider }) => provider);

              if (deleteProviderIds.length) await ceramicClient.deleteStampIDs(deleteProviderIds);

              await ceramicClient.setStamps(newPassport.stamps);
            } catch (e) {
              console.log("error patching ceramic stamps", e);
            }
          })();
        }

        if (dbAccessToken) {
          refreshScore(address, dbAccessToken);
        }
      }
    } catch (e) {
      datadogLogs.logger.error("Error patching stamps", { stampPatches, error: e });
      throw e;
    }
  };

  const handleDeleteStamps = async (providerIds: PROVIDER_ID[]): Promise<void> => {
    try {
      if (database) {
        await database.deleteStamps(providerIds);

        const newPassport = await fetchPassport(database, true);
        if (ceramicClient && newPassport) {
          ceramicClient.setStamps(newPassport.stamps).catch((e) => console.log("error setting ceramic stamps", e));
        }
        if (dbAccessToken) {
          refreshScore(address, dbAccessToken);
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

  const providerProps = {
    passport,
    isLoadingPassport,
    allProvidersState,
    allPlatforms: platforms,
    handleCreatePassport,
    handleAddStamps,
    handlePatchStamps,
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
