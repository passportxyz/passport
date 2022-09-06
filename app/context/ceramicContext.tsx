import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Passport, PLATFORM_ID, PROVIDER_ID, Stamp } from "@gitcoin/passport-types";
import { ProviderSpec, STAMP_PROVIDERS } from "../config/providers";
import { CeramicDatabase } from "@gitcoin/passport-database-client";
import { useViewerConnection } from "@self.id/framework";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { UserContext } from "./userContext";

// -- Trusted IAM servers DID
const IAM_ISSUER_DID = process.env.NEXT_PUBLIC_PASSPORT_IAM_ISSUER_DID || "";

export interface CeramicContextState {
  passport: Passport | undefined | false;
  isLoadingPassport: IsLoadingPassportState;
  allProvidersState: AllProvidersState;
  handleCreatePassport: () => Promise<void>;
  handleAddStamp: (stamp: Stamp) => Promise<void>;
  handleAddStamps: (stamps: Stamp[]) => Promise<void>;
  handleDeleteStamp: (streamId: string) => Promise<void>;
  userDid: string | undefined;
}

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
  ETH: {
    providerSpec: getProviderSpec("ETH", "ETH"),
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
};

const startingState: CeramicContextState = {
  passport: undefined,
  isLoadingPassport: IsLoadingPassportState.Loading,
  allProvidersState: startingAllProvidersState,
  handleCreatePassport: async () => {},
  handleAddStamp: async () => {},
  handleAddStamps: async () => {},
  handleDeleteStamp: async (streamId: string) => {},
  userDid: undefined,
};

export const CeramicContext = createContext(startingState);

export const CeramicContextProvider = ({ children }: { children: any }) => {
  const [allProvidersState, setAllProviderState] = useState(startingAllProvidersState);
  const [ceramicDatabase, setCeramicDatabase] = useState<CeramicDatabase | undefined>(undefined);
  const [isLoadingPassport, setIsLoadingPassport] = useState<IsLoadingPassportState>(IsLoadingPassportState.Loading);
  const [passport, setPassport] = useState<Passport | undefined>(undefined);
  const [userDid, setUserDid] = useState<string | undefined>();
  const [viewerConnection] = useViewerConnection();

  const { address } = useContext(UserContext);

  useEffect(() => {
    return () => {
      clearAllProvidersState();
      setCeramicDatabase(undefined);
      setPassport(undefined);
      setUserDid(undefined);
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
    let passport = (await database.getPassport()) as Passport;
    if (passport) {
      passport = cleanPassport(passport, database) as Passport;
      hydrateAllProvidersState(passport);
      setPassport(passport);
      if (!skipLoadingState) setIsLoadingPassport(IsLoadingPassportState.Idle);
    } else if (passport === false) {
      handleCreatePassport();
    } else {
      // something is wrong with Ceramic...
      datadogRum.addError("Ceramic connection failed", { address });
      setPassport(passport);
      if (!skipLoadingState) setIsLoadingPassport(IsLoadingPassportState.FailedToConnect);
    }
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
      passport.stamps.forEach((stamp: Stamp, index: number) => {
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

  const stateMemo = useMemo(
    () => ({
      passport,
      isLoadingPassport,
      allProvidersState,
      handleCreatePassport,
      handleAddStamp,
      handleAddStamps,
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
    handleCreatePassport,
    handleAddStamp,
    handleAddStamps,
    handleDeleteStamp,
    userDid,
  };

  return <CeramicContext.Provider value={providerProps}>{children}</CeramicContext.Provider>;
};
