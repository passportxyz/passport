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
import { DataStorageBase, ComposeDatabase, PassportDatabase } from "@gitcoin/passport-database-client";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { useWalletStore } from "./walletStore";
import { ScorerContext } from "./scorerContext";

import { PlatformGroupSpec, ProviderSpec, platforms as stampPlatforms } from "@gitcoin/passport-platforms";
import { PlatformProps } from "../components/GenericPlatform";

import { CERAMIC_CACHE_ENDPOINT, IAM_VALID_ISSUER_DIDS } from "../config/stamp_config";
import { useDatastoreConnectionContext } from "./datastoreConnectionContext";
import { useCustomization } from "../hooks/useCustomization";
import { useMessage } from "../hooks/useMessage";
import { usePlatforms } from "../hooks/usePlatforms";

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
  platformExpirationDates: Partial<Record<PLATFORM_ID, Date>>; // the value should be the earliest expiration date
  databaseReady: boolean;
  database: PassportDatabase | undefined;
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

export const handleComposeRetry = async (
  composeStamps: Stamp[],
  passDbPassport: Passport,
  ceramicClient?: ComposeDatabase
): Promise<SecondaryStorageBulkPatchResponse | void> => {
  if (ceramicClient) {
    try {
      // using stamps as the source of truth, filter stamps for where the issuanceDate does not match the composeStamp if there is a composeStamp with the same provider
      const stampsToRetry = passDbPassport.stamps.filter((stamp: Stamp) => {
        const existingStamp = composeStamps.find((composeStamp: Stamp) => stamp.provider === composeStamp.provider);
        if (!existingStamp || stamp.credential.issuanceDate !== existingStamp.credential.issuanceDate) {
          return true;
        }
      });
      // then add the stamps to ComposeDB
      if (stampsToRetry.length > 0) {
        // perform an update using the stamps that need to be retried
        const composeDBPatchResponse = await ceramicClient.patchStamps(stampsToRetry);
        return composeDBPatchResponse;
      } else {
        console.log("No stamps to retry");
      }
    } catch (e) {
      console.log("error adding ceramic stamps", e);
      datadogLogs.logger.error("Error adding ceramic stamps", { stamps: composeStamps, error: e });
    }
  }
};

const startingState: CeramicContextState = {
  passport: undefined,
  isLoadingPassport: IsLoadingPassportState.Loading,
  allProvidersState: startingAllProvidersState,
  allPlatforms: new Map<PLATFORM_ID, PlatformProps>(),
  handleCreatePassport: async () => {},
  handleAddStamps: async () => {},
  handlePatchStamps: async () => {},
  handleDeleteStamps: async () => {},
  passportHasCacaoError: false,
  cancelCeramicConnection: () => {},
  userDid: undefined,
  expiredProviders: [],
  expiredPlatforms: {},
  platformExpirationDates: {}, // <platform_id> : <earliest_exp_date>
  passportLoadResponse: undefined,
  verifiedProviderIds: [],
  verifiedPlatforms: {},
  databaseReady: false,
  database: undefined,
};

export const CeramicContext = createContext(startingState);

export const cleanPassport = (
  passport: Passport,
  database: DataStorageBase,
  validProviderIds: PROVIDER_ID[]
): {
  passport: Passport;
  expiredProviders: PROVIDER_ID[];
  expirationDateProviders: Partial<Record<PROVIDER_ID, Date>>;
} => {
  const tempExpiredProviders: PROVIDER_ID[] = [];
  let expirationDateProviders: Partial<Record<PROVIDER_ID, Date>> = {};
  if (passport) {
    passport.stamps = passport.stamps.filter((stamp: Stamp) => {
      if (stamp) {
        const providerId = stamp.credential.credentialSubject.provider as PROVIDER_ID;
        if (!validProviderIds.includes(providerId)) {
          return false;
        }

        const has_correct_issuer = IAM_VALID_ISSUER_DIDS.has(stamp.credential.issuer);
        const has_correct_subject = stamp.credential.credentialSubject.id.toLowerCase() === database.did;
        const has_expired = new Date(stamp.credential.expirationDate) < new Date();

        expirationDateProviders[providerId] = new Date(stamp.credential.expirationDate);

        if (has_expired && has_correct_issuer && has_correct_subject) {
          tempExpiredProviders.push(providerId);
        }

        return has_correct_issuer && has_correct_subject;
      } else {
        return false;
      }
    });
  }
  return { passport, expiredProviders: tempExpiredProviders, expirationDateProviders };
};

export const CeramicContextProvider = ({ children }: { children: any }) => {
  const [allProvidersState, setAllProviderState] = useState(startingAllProvidersState);
  const resolveCancel = useRef<() => void>();
  const [ceramicClient, setCeramicClient] = useState<ComposeDatabase | undefined>(undefined);
  const [isLoadingPassport, setIsLoadingPassport] = useState<IsLoadingPassportState>(IsLoadingPassportState.Loading);
  const [passport, setPassport] = useState<Passport | undefined>(undefined);
  const [initialPassport, setInitialPassport] = useState<Passport | undefined>(undefined);
  const [initialCeramicStamps, setInitialCeramicStamps] = useState<Stamp[] | undefined>(undefined);
  const [userDid, setUserDid] = useState<string | undefined>();
  const [expiredProviders, setExpiredProviders] = useState<PROVIDER_ID[]>([]);
  const [expirationDateProviders, setExpirationDateProviders] = useState<Partial<Record<PROVIDER_ID, Date>>>({}); // <provider> : <expiration_date>
  const [passportLoadResponse, setPassportLoadResponse] = useState<PassportLoadResponse | undefined>();
  const [passportHasCacaoError, setPassportHasCacaoError] = useState<boolean>(false);
  const [database, setDatabase] = useState<PassportDatabase | undefined>(undefined);
  const { platforms: allPlatforms } = usePlatforms();

  const address = useWalletStore((state) => state.address);
  const { dbAccessToken, did, checkSessionIsValid } = useDatastoreConnectionContext();
  const { refreshScore, fetchStampWeights } = useContext(ScorerContext);
  const customization = useCustomization();

  const providerSpecs = useMemo(() => {
    const providerSpecs: Partial<Record<PROVIDER_ID, ProviderSpec>> = {};
    allPlatforms.forEach((platformProps) => {
      platformProps.platFormGroupSpec.forEach(({ providers }) => {
        providers.forEach((provider) => {
          providerSpecs[provider.name] = provider;
        });
      });
    });
    return providerSpecs;
  }, [allPlatforms]);

  const { failure } = useMessage();

  useEffect(() => {}, [customization]);

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
    if (database && address) {
      fetchPassport(database, false, true).then((passport) => {
        if (passport) {
          setInitialPassport(passport);
        }
      });
    }
  }, [database, address]);

  useEffect(() => {
    fetchStampWeights();
  }, [customization.key]);

  useEffect(() => {
    if (ceramicClient) {
      ceramicClient
        .getPassport()
        .then((passportResponse) => {
          if (passportResponse !== undefined) {
            const { passport } = passportResponse;
            if (passport) {
              setInitialCeramicStamps(passport.stamps);
            }
            console.log("loaded passport from compose-db", passportResponse);
            datadogLogs.logger.info("loaded passport from compose-db", { passportResponse });
          }
        })
        .catch((e) => {
          console.log("failed to load passport from compose-db", e);
          datadogLogs.logger.error("failed to load passport from compose-db", { error: e });
        });
    }
  }, [ceramicClient]);

  useEffect(() => {
    if (initialPassport && ceramicClient && initialCeramicStamps) {
      handleComposeRetry(initialCeramicStamps, initialPassport, ceramicClient)
        .then((response) => {
          if (response) {
            console.log("retry response", response);
          }
        })
        .catch((e) => {
          console.log("error retrying stamps", e);
          datadogLogs.logger.error("Error retrying stamps", { error: e });
        });
    }
  }, [initialCeramicStamps, initialPassport, ceramicClient]);

  const checkAndAlertInvalidCeramicSession = useCallback(() => {
    if (!checkSessionIsValid()) {
      failure({
        title: "Ceramic Session Invalid",
        message: "Your update was not logged to Ceramic. Please refresh the page to reset your Ceramic session.",
      });
      throw new Error("Session Expired");
    }
  }, [failure, checkSessionIsValid]);

  const passportLoadSuccess = (
    database: PassportDatabase,
    passport?: Passport,
    skipLoadingState?: boolean
  ): Passport => {
    if (!passport) {
      passport = { stamps: [] };
    }
    const {
      passport: cleanedPassport,
      expiredProviders,
      expirationDateProviders,
    } = cleanPassport(passport, database, Object.keys(providerSpecs) as PROVIDER_ID[]);
    setExpiredProviders(expiredProviders);
    setExpirationDateProviders(expirationDateProviders);
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
        loadScore();
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
        loadScore();
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
        loadScore();
      }
    } catch (e) {
      datadogLogs.logger.error("Error deleting multiple stamps", { providerIds, error: e });
      throw e;
    }
  };

  const loadScore = () => {
    if (dbAccessToken) {
      // Currently the ceramic-cache/stamps endpoints refresh the main scorer,
      // but not any alternate scorer used by a customization. So, we must
      // force a refresh in that case. If we start passing the alternate_scorer_id
      // to the ceramic-cache/stamps endpoints, we can remove this.
      const forceRefresh = Boolean(customization.scorer?.id);
      refreshScore(address, dbAccessToken, forceRefresh);
    }
  };

  const hydrateAllProvidersState = (passport?: Passport) => {
    let existingProviderState = { ...startingAllProvidersState };
    if (customization.allowListProviders) {
      const providerSpecs = customization.allowListProviders.map(({ providers }) => providers).flat();

      const allowListProviderState = providerSpecs.reduce(
        (providerState, providerSpec) => ({
          ...providerState,
          [providerSpec.name]: {
            providerSpec,
            stamp: undefined,
          },
        }),
        {}
      );
      existingProviderState = {
        ...existingProviderState,
        ...allowListProviderState,
      };
    }

    if (passport) {
      // set stamps into allProvidersState
      let newAllProviderState = { ...existingProviderState };
      passport.stamps.forEach((stamp: Stamp) => {
        const { provider } = stamp;
        const providerSpec = providerSpecs[provider];
        if (providerSpec) {
          const newProviderState = {
            providerSpec,
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

  const verifiedPlatforms: Record<PLATFORM_ID, PlatformProps> = useMemo(
    () =>
      Object.entries(Object.fromEntries(allPlatforms)).reduce(
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
    [verifiedProviderIds, allPlatforms]
  );
  const expiredPlatforms = useMemo(
    () =>
      Object.entries(Object.fromEntries(allPlatforms)).reduce(
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
    [verifiedProviderIds, allPlatforms]
  );

  const platformExpirationDates = useMemo(() => {
    let ret = {} as Partial<Record<PLATFORM_ID, Date>>;
    allPlatforms.forEach((platformProps, platformKey) => {
      const providerGroups = platformProps.platFormGroupSpec;

      // Determine the earliest expiration date for each platform
      // This will iterate over all platform groups, check the earliest expiration date for each group, and then the earliest expiration for the platform
      const earliestExpirationDate = providerGroups.reduce(
        (earliestGroupExpirationDate, groupSpec) => {
          const earliestPlatformExpirationDate: Date | undefined = groupSpec.providers.reduce(
            (earliestProviderDate, provider) => {
              const d = expirationDateProviders[provider.name as PROVIDER_ID];
              if (earliestProviderDate && d && d < earliestProviderDate) {
                return d;
              }
              // If one of d or earliestProviderDate is undefined, this will return the one that is defined
              // or undefined if both are undefined
              return d || earliestProviderDate;
            },
            undefined as Date | undefined
          );

          if (
            earliestPlatformExpirationDate &&
            earliestGroupExpirationDate &&
            earliestPlatformExpirationDate < earliestGroupExpirationDate
          ) {
            return earliestPlatformExpirationDate;
          }
          // If one of earliestPlatformExpirationDate or earliestGroupExpirationDate is undefined, this will return the one that is defined
          // or undefined if both are undefined
          return earliestPlatformExpirationDate || earliestGroupExpirationDate;
        },
        undefined as Date | undefined
      );
      ret[platformKey as PLATFORM_ID] = earliestExpirationDate;
    });
    return ret;
  }, [verifiedProviderIds, allPlatforms, expirationDateProviders]);

  const providerProps = {
    passport,
    isLoadingPassport,
    allProvidersState,
    allPlatforms,
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
    platformExpirationDates,
    databaseReady: !!database,
    database,
  };

  return <CeramicContext.Provider value={providerProps}>{children}</CeramicContext.Provider>;
};
