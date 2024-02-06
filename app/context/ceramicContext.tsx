import { createContext, useContext, useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  ComposeDBMetadataRequest,
  ComposeDBSaveStatus,
  Passport,
  PassportLoadResponse,
  PassportLoadStatus,
  PLATFORM_ID,
  PROVIDER_ID,
  SecondaryStorageBulkPatchResponse,
  Stamp,
  StampPatch,
} from "@gitcoin/passport-types";
import { ProviderSpec } from "../config/providers";
import { DataStorageBase, ComposeDatabase, PassportDatabase } from "@gitcoin/passport-database-client";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { useWalletStore } from "./walletStore";
import { ScorerContext } from "./scorerContext";

import { PlatformGroupSpec, platforms as stampPlatforms } from "@gitcoin/passport-platforms";
const {
  Twitter,
  Ens,
  Lens,
  Github,
  Gitcoin,
  Poh,
  PHI,
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
  Holonym,
  Idena,
  Civic,
  CyberConnect,
  TrustaLabs,
} = stampPlatforms;
import { PlatformProps } from "../components/GenericPlatform";

import { CERAMIC_CACHE_ENDPOINT, IAM_VALID_ISSUER_DIDS } from "../config/stamp_config";
import { useDatastoreConnectionContext } from "./datastoreConnectionContext";
import { useToast } from "@chakra-ui/react";
import { DoneToastContent } from "../components/DoneToastContent";

// -- Trusted IAM servers DID
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
  cancelCeramicConnection: () => void;
  userDid: string | undefined;
  expiredProviders: PROVIDER_ID[];
  expiredPlatforms: Partial<Record<PLATFORM_ID, PlatformProps>>;
  passportHasCacaoError: boolean;
  passportLoadResponse?: PassportLoadResponse;
  verifiedProviderIds: PROVIDER_ID[];
  verifiedPlatforms: Partial<Record<PLATFORM_ID, PlatformProps>>;
}

export const platforms = new Map<PLATFORM_ID, PlatformProps>();

platforms.set("Twitter", {
  platform: new Twitter.TwitterPlatform(),
  platFormGroupSpec: Twitter.ProviderConfig,
});

platforms.set("Ens", {
  platform: new Ens.EnsPlatform(),
  platFormGroupSpec: Ens.ProviderConfig,
});

platforms.set("NFT", {
  platform: new NFT.NFTPlatform(),
  platFormGroupSpec: NFT.ProviderConfig,
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

if (process.env.NEXT_PUBLIC_FF_TRUSTALABS_STAMPS === "on") {
  platforms.set("TrustaLabs", {
    platform: new TrustaLabs.TrustaLabsPlatform(),
    platFormGroupSpec: TrustaLabs.ProviderConfig,
  });
}

export enum IsLoadingPassportState {
  Idle,
  Loading,
  CreatingPassport,
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
  passportHasCacaoError: false,
  cancelCeramicConnection: () => {},
  userDid: undefined,
  expiredProviders: [],
  expiredPlatforms: {},
  passportLoadResponse: undefined,
  verifiedProviderIds: [],
  verifiedPlatforms: {},
};

export const CeramicContext = createContext(startingState);

export const cleanPassport = (
  passport: Passport,
  database: DataStorageBase,
  allProvidersState: AllProvidersState
): {
  passport: Passport;
  expiredProviders: PROVIDER_ID[];
} => {
  const tempExpiredProviders: PROVIDER_ID[] = [];
  const currentProviderIds = Object.keys(allProvidersState);
  // clean stamp content if expired or from a different issuer
  if (passport) {
    passport.stamps = passport.stamps.filter((stamp: Stamp) => {
      if (stamp) {
        const providerId = stamp.credential.credentialSubject.provider as PROVIDER_ID;
        if (!currentProviderIds.includes(providerId)) {
          return false;
        }

        const has_correct_issuer = IAM_VALID_ISSUER_DIDS.has(stamp.credential.issuer);
        const has_correct_subject = stamp.credential.credentialSubject.id.toLowerCase() === database.did;
        const has_expired = new Date(stamp.credential.expirationDate) < new Date();

        if (has_expired && has_correct_issuer && has_correct_subject) {
          tempExpiredProviders.push(providerId);
        }

        return !has_expired && has_correct_issuer && has_correct_subject;
      } else {
        return false;
      }
    });
  }

  return { passport, expiredProviders: tempExpiredProviders };
};

export const CeramicContextProvider = ({ children }: { children: any }) => {
  const [allProvidersState, setAllProviderState] = useState(startingAllProvidersState);
  const resolveCancel = useRef<() => void>();
  const [ceramicClient, setCeramicClient] = useState<ComposeDatabase | undefined>(undefined);
  const [isLoadingPassport, setIsLoadingPassport] = useState<IsLoadingPassportState>(IsLoadingPassportState.Loading);
  const [passport, setPassport] = useState<Passport | undefined>(undefined);
  const [userDid, setUserDid] = useState<string | undefined>();
  const [expiredProviders, setExpiredProviders] = useState<PROVIDER_ID[]>([]);
  const [passportLoadResponse, setPassportLoadResponse] = useState<PassportLoadResponse | undefined>();
  const [passportHasCacaoError, setPassportHasCacaoError] = useState<boolean>(false);
  const [database, setDatabase] = useState<PassportDatabase | undefined>(undefined);

  const address = useWalletStore((state) => state.address);
  const { dbAccessToken, did, checkSessionIsValid } = useDatastoreConnectionContext();
  const { refreshScore, fetchStampWeights } = useContext(ScorerContext);

  const toast = useToast();

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
    try {
      if (dbAccessToken && address && !database && did) {
        // Ceramic Network Connection
        const ceramicClientInstance = new ComposeDatabase(
          did,
          process.env.NEXT_PUBLIC_CERAMIC_CLIENT_URL,
          datadogLogs.logger
        );
        if (process.env.NEXT_PUBLIC_FF_CERAMIC_CLIENT && process.env.NEXT_PUBLIC_FF_CERAMIC_CLIENT === "on") {
          setCeramicClient(ceramicClientInstance);
        }
        setUserDid(ceramicClientInstance.did);
        // Ceramic cache db
        const databaseInstance = new PassportDatabase(
          CERAMIC_CACHE_ENDPOINT || "",
          address,
          dbAccessToken,
          datadogLogs.logger,
          did
        );

        setDatabase(databaseInstance);
      } else {
        setCeramicClient(undefined);
        setDatabase(undefined);
        setIsLoadingPassport(IsLoadingPassportState.Loading);
      }
    } catch (e) {
      console.log("failed to connect self id :(");
      setCeramicClient(undefined);
      setDatabase(undefined);
    }
  }, [address, dbAccessToken]);

  useEffect(() => {
    if (database) {
      fetchStampWeights();
      fetchPassport(database, false, true);
    }
  }, [database]);

  useEffect(() => {
    if (ceramicClient) {
      ceramicClient
        .getPassport()
        .then((passportResponse) => {
          console.log("loaded passport from compose-db", passportResponse);
          datadogLogs.logger.info("loaded passport from compose-db", { passportResponse });
        })
        .catch((e) => {
          console.log("failed to load passport from compose-db", e);
          datadogLogs.logger.error("failed to load passport from compose-db", { error: e });
        });
    }
  }, [ceramicClient]);

  const checkAndAlertInvalidCeramicSession = useCallback(() => {
    if (!checkSessionIsValid()) {
      toast({
        render: (result: any) => (
          <DoneToastContent
            title="Ceramic Session Invalid"
            body="Your update was not logged to Ceramic. Please refresh the page to reset your Ceramic session."
            icon="../assets/verification-failed-bright.svg"
            result={result}
          />
        ),
        duration: 9000,
        isClosable: true,
      });
      throw new Error("Session Expired");
    }
  }, [toast, checkSessionIsValid]);

  const passportLoadSuccess = (
    database: PassportDatabase,
    passport?: Passport,
    skipLoadingState?: boolean
  ): Passport => {
    if (!passport) {
      passport = { stamps: [] };
    }
    const { passport: cleanedPassport, expiredProviders } = cleanPassport(passport, database, allProvidersState);
    setExpiredProviders(expiredProviders);
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
    } catch (e) {
      return false;
    }
  };

  const handlePassportUpdate = async (
    passportResponse: PassportLoadResponse,
    database: PassportDatabase,
    skipLoadingState?: boolean,
    isInitialLoad?: boolean
  ) => {
    let passportToReturn: Passport | undefined = undefined;

    const { status, errorDetails, passport } = passportResponse;

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

  const fetchPassport = async (
    database: PassportDatabase,
    skipLoadingState?: boolean,
    isInitialLoad?: boolean
  ): Promise<Passport | undefined> => {
    if (!skipLoadingState) setIsLoadingPassport(IsLoadingPassportState.Loading);

    // fetch, clean and set the new Passport state
    const getResponse = await database.getPassport();

    return await handlePassportUpdate(getResponse, database, skipLoadingState, isInitialLoad);
  };

  const handleCreatePassport = async (): Promise<void> => {
    if (database) {
      setIsLoadingPassport(IsLoadingPassportState.CreatingPassport);
      await database.createPassport();
      await fetchPassport(database);
    }
  };

  const cancelCeramicConnection = () => {
    if (resolveCancel?.current) resolveCancel.current();
  };

  const handleAddStamps = async (stamps: Stamp[]): Promise<void> => {
    try {
      if (database) {
        const addResponse = await database.addStamps(stamps);

        handlePassportUpdate(addResponse, database);

        if (ceramicClient && addResponse.passport) {
          (async () => {
            try {
              checkAndAlertInvalidCeramicSession();
              const composeDBAddResponse = await ceramicClient.addStamps(stamps);
              const composeDBMetadata = processComposeDBMetadata(addResponse.passport, {
                adds: composeDBAddResponse,
                deletes: [],
              });
              await database.patchStampComposeDBMetadata(composeDBMetadata);
            } catch (e) {
              console.log("error adding ceramic stamps", e);
              datadogLogs.logger.error("Error adding ceramic stamps", { stamps, error: e });
            }
          })();
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

  const processComposeDBMetadata = (
    updatedPassport: Passport | undefined,
    composeDBPatchResponse: SecondaryStorageBulkPatchResponse
  ): ComposeDBMetadataRequest[] => {
    composeDBPatchResponse.deletes.forEach(({ secondaryStorageId, secondaryStorageError }) => {
      if (secondaryStorageError) {
        console.log(`Failed to delete stamp ${secondaryStorageId} from secondary storage: ${secondaryStorageError}`);
        datadogLogs.logger.error(
          `Failed to delete stamp ${secondaryStorageId} from secondary storage: ${secondaryStorageError}`
        );
      }
    });

    return composeDBPatchResponse.adds
      .map((addResponse) => {
        const { provider, secondaryStorageId, secondaryStorageError } = addResponse;

        if (secondaryStorageError) {
          console.log(
            `Failed to add stamp ${secondaryStorageId} to secondary storage, error: ${secondaryStorageError}`
          );
          datadogLogs.logger.error("Error adding stamp to secondary storage", {
            stamp: addResponse,
            error: secondaryStorageError,
          });
        }

        const primaryStorageId = updatedPassport?.stamps.find((stamp) => stamp.provider === provider)?.id;

        if (!primaryStorageId) {
          console.log(`Stamp ID not found for provider ${provider} when adding to secondary storage`);
          datadogLogs.logger.error(`Stamp ID not found for provider ${provider} when adding to secondary storage`);
        } else {
          const compose_db_save_status: ComposeDBSaveStatus =
            !secondaryStorageError && secondaryStorageId ? "saved" : "failed";
          return {
            id: primaryStorageId,
            compose_db_stream_id: secondaryStorageId,
            compose_db_save_status,
          };
        }
      })
      .filter((v?: ComposeDBMetadataRequest): v is ComposeDBMetadataRequest => Boolean(v));
  };

  const handlePatchStamps = async (stampPatches: StampPatch[]): Promise<void> => {
    try {
      if (database) {
        const patchResponse = await database.patchStamps(stampPatches);
        handlePassportUpdate(patchResponse, database);

        if (ceramicClient && patchResponse.passport) {
          (async () => {
            try {
              checkAndAlertInvalidCeramicSession();
              const composeDBPatchResponse = await ceramicClient.patchStamps(stampPatches);
              const composeDBMetadata = processComposeDBMetadata(patchResponse.passport, composeDBPatchResponse);
              await database.patchStampComposeDBMetadata(composeDBMetadata);
            } catch (e) {
              console.log("error patching ceramic stamps", e);
              datadogLogs.logger.error("Error patching ceramic stamps", { stampPatches, error: e });
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
        const deleteResponse = await database.deleteStamps(providerIds);
        handlePassportUpdate(deleteResponse, database);
        if (ceramicClient && deleteResponse.status === "Success" && deleteResponse.passport?.stamps) {
          (async () => {
            try {
              checkAndAlertInvalidCeramicSession();
              const responses = await ceramicClient.deleteStamps(providerIds);
              processComposeDBMetadata(deleteResponse.passport, { adds: [], deletes: responses });
            } catch (e) {
              console.log("error deleting ceramic stamps", e);
              datadogLogs.logger.error("Error deleting ceramic stamps", { providerIds, error: e });
            }
          })();
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

  const verifiedProviderIds = useMemo(
    () =>
      Object.entries(allProvidersState).reduce((providerIds, [providerId, providerState]) => {
        if (typeof providerState?.stamp?.credential !== "undefined") providerIds.push(providerId as PROVIDER_ID);
        return providerIds;
      }, [] as PROVIDER_ID[]),
    [allProvidersState]
  );

  const verifiedPlatforms = useMemo(
    () =>
      Object.entries(Object.fromEntries(platforms)).reduce(
        (validPlatformProps, [platformKey, platformProps]) => {
          if (
            platformProps.platFormGroupSpec.some(({ providers }) =>
              providers.some(({ name }) => verifiedProviderIds.includes(name))
            )
          )
            validPlatformProps[platformKey as PLATFORM_ID] = platformProps;
          return validPlatformProps;
        },
        {} as Record<PLATFORM_ID, PlatformProps>
      ),
    [verifiedProviderIds, platforms]
  );

  const expiredPlatforms = useMemo(
    () =>
      Object.entries(Object.fromEntries(platforms)).reduce(
        (validPlatformProps, [platformKey, platformProps]) => {
          if (
            platformProps.platFormGroupSpec.some(({ providers }) =>
              providers.some(({ name }) => expiredProviders.includes(name))
            )
          )
            validPlatformProps[platformKey as PLATFORM_ID] = platformProps;
          return validPlatformProps;
        },
        {} as Record<PLATFORM_ID, PlatformProps>
      ),
    [verifiedProviderIds, platforms]
  );

  const providerProps = {
    passport,
    isLoadingPassport,
    allProvidersState,
    allPlatforms: platforms,
    handleCreatePassport,
    handleAddStamps,
    handlePatchStamps,
    handleDeleteStamps,
    cancelCeramicConnection,
    userDid,
    expiredProviders,
    expiredPlatforms,
    passportLoadResponse,
    passportHasCacaoError,
    verifiedProviderIds,
    verifiedPlatforms,
  };

  return <CeramicContext.Provider value={providerProps}>{children}</CeramicContext.Provider>;
};
