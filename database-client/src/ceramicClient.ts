import { TileDocument } from "@ceramicnetwork/stream-tile";
import {
  DID,
  PROVIDER_ID,
  Stamp,
  VerifiableCredential,
  PassportLoadStatus,
  PassportLoadResponse,
  PassportLoadErrorDetails,
  Passport,
} from "@gitcoin/passport-types";

// -- Ceramic and Glazed
import type { CeramicApi, Stream } from "@ceramicnetwork/common";
import { SyncOptions } from "@ceramicnetwork/common";
import { CeramicClient } from "@ceramicnetwork/http-client";
import publishedModel from "@gitcoin/passport-schemas/scripts/publish-model.json";
import { DataModel } from "@glazed/datamodel";
import { DIDDataStore } from "@glazed/did-datastore";
import { TileLoader } from "@glazed/tile-loader";
import type { DID as CeramicDID } from "dids";
import { StreamID } from "@ceramicnetwork/streamid";
import axios from "axios";
import { DataStorageBase } from "./types";

// const LOCAL_CERAMIC_CLIENT_URL = "http://localhost:7007";
const COMMUNITY_TESTNET_CERAMIC_CLIENT_URL = "https://ceramic-clay.3boxlabs.com";

type CeramicStamp = {
  provider: string;
  credential: string;
};
type CeramicPassport = {
  issuanceDate: string;
  expiryDate: string;
  stamps: CeramicStamp[];
};

export type ModelTypes = {
  schemas: {
    Passport: CeramicPassport;
    VerifiableCredential: VerifiableCredential;
  };
  definitions: {
    Passport: "Passport";
    VerifiableCredential: "VerifiableCredential";
  };
  tiles: {};
};

export type Logger = {
  error: (msg: string, context?: object) => void;
  log: (msg: string, context?: object) => void;
  warn: (msg: string, context?: object) => void;
  debug: (msg: string, context?: object) => void;
  info: (msg: string, context?: object) => void;
};

type StampLoadResponse = {
  successfulStamps: Stamp[];
  cacaoErrorStampIds: string[];
};

export class CeramicDatabase implements DataStorageBase {
  did: string;
  loader: TileLoader;
  ceramicClient: CeramicApi;
  model: DataModel<ModelTypes>;
  store: DIDDataStore<ModelTypes>;
  logger: Logger;
  apiHost: string;

  constructor(did?: CeramicDID, ceramicHost?: string, aliases?: any, logger?: Logger) {
    if (logger) {
      this.logger = logger;
    } else {
      this.logger = console;
    }

    // Create the Ceramic instance and inject the DID
    this.apiHost = ceramicHost ?? COMMUNITY_TESTNET_CERAMIC_CLIENT_URL;
    const ceramic = new CeramicClient(this.apiHost);
    ceramic.setDID(did);

    // Create the loader, model and store
    const loader = new TileLoader({ ceramic });
    const model = new DataModel({ ceramic, aliases: aliases ?? publishedModel });
    const store = new DIDDataStore({ loader, ceramic, model });

    // Store the users did:pkh here to verify match on credential
    this.did = (did.hasParent ? did.parent : did.id).toLowerCase();

    // Store state into class
    this.loader = loader;
    this.ceramicClient = ceramic;
    this.model = model;
    this.store = store;
  }

  async createPassport(): Promise<DID> {
    this.logger.info(`create new passport for did ${this.did}`);
    const date = new Date();
    const newPassport: CeramicPassport = {
      issuanceDate: date.toISOString(),
      expiryDate: date.toISOString(),
      stamps: [],
    };
    const stream = await this.store.set("Passport", { ...newPassport });
    return stream.toUrl();
  }

  async checkPassportCACAOError(): Promise<boolean> {
    try {
      let recordId = await this.store.getRecordID(this.model.getDefinitionID("Passport"));
      if (recordId) {
        // Drop the `ceramic://`
        recordId = recordId.substring(10);
        const streamUrl = `${this.apiHost}/api/v0/streams/${recordId}`;
        await axios.get(streamUrl);
      }
      return false;
    } catch (e) {
      this.logger.error(`checkPassportCACAOError - Error when calling getRecordDocument on Passport`, { error: e });
      if (
        e?.response?.data?.error?.includes("CACAO has expired") ||
        e?.response?.data?.error?.includes("CACAO expired")
      ) {
        return true;
      }
    }
    return false;
  }

  async refreshPassport(): Promise<boolean> {
    let attempts = 1;
    let success = false;

    let passportId;
    try {
      this.logger.info("refreshPassport - getRecordDocument");
      passportId = await this.store.getRecordID(this.model.getDefinitionID("Passport"));
    } catch (e) {
      this.logger.info("refreshPassport - failed to get record document", { error: e });
      // unable to get passport doc
      return false;
    }
    // Attempt to load stream 36 times, with 5 second delay between each attempt - 5 min total
    while (attempts < 36 && !success) {
      const options = attempts === 1 ? { sync: SyncOptions.SYNC_ALWAYS } : {};
      try {
        this.logger.info(
          `refreshPassport - loading stream with SyncOptions.SYNC_ALWAYS, attempt:${attempts}, stream=${passportId}`,
          { options: options }
        );
        await this.ceramicClient.loadStream<TileDocument>(passportId, options);
        success = true;
        this.logger.info(
          `refreshPassport - loading stream with SyncOptions.SYNC_ALWAYS, attempt:${attempts}, stream=${passportId} => SUCCESS`
        );
        return success;
      } catch (e) {
        this.logger.error(`refreshPassport - error when calling loadStream on passport, attempt ${attempts}`, {
          error: e,
        });
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
    return false;
  }

  async getPassport(): Promise<PassportLoadResponse> {
    let passport: Passport;
    let status: PassportLoadStatus = "Success";
    let errorDetails: PassportLoadErrorDetails;

    try {
      const ceramicPassport = await this.store.get("Passport");
      this.logger.info(`loaded passport for did ${this.did} => ${JSON.stringify(ceramicPassport)}`);

      // According to the logs, it does happen that passport is sometimes an empty object {}
      // We treat this case as an non-existent passport
      if (!ceramicPassport?.stamps) status = "DoesNotExist";
      else {
        const { successfulStamps, cacaoErrorStampIds } = await this.loadStamps(ceramicPassport);

        if (cacaoErrorStampIds.length) {
          errorDetails = { stampStreamIds: cacaoErrorStampIds };
          status = "StampCacaoError";
        }

        passport = {
          issuanceDate: new Date(ceramicPassport.issuanceDate),
          expiryDate: new Date(ceramicPassport.expiryDate),
          stamps: successfulStamps,
        };

        await this.pinCurrentPassport();
      }
    } catch (e) {
      status = "ExceptionRaised";
      this.logger.error(`Error when loading passport for did  ${this.did}:` + e.toString(), { error: e });
    } finally {
      const possiblePassportCacaoErrorStatuses: PassportLoadStatus[] = ["DoesNotExist", "ExceptionRaised"];
      if (possiblePassportCacaoErrorStatuses.includes(status) && (await this.checkPassportCACAOError()))
        status = "PassportCacaoError";

      return {
        passport,
        status,
        errorDetails,
      };
    }
  }

  async pinCurrentPassport(): Promise<void> {
    try {
      const passportDoc = await this.store.getRecordDocument(this.model.getDefinitionID("Passport"));
      await this.ceramicClient.pin.add(passportDoc.id);
    } catch (e) {
      this.logger.error(`Error when pinning passport for did  ${this.did}:` + e.toString(), { error: e });
    }
  }

  async loadStamps(passport: CeramicPassport): Promise<StampLoadResponse> {
    const cacaoErrorStampIds = [];

    // `stamps` is stored as ceramic URLs - must load actual VC data from URL
    const stampsToLoad = passport.stamps.map(async (stamp) => {
      const streamId = stamp.credential;
      const streamUrl = `${this.apiHost}/api/v0/streams/${streamId.substring(10)}`;
      this.logger.log(`get stamp from streamUrl: ${streamUrl}`);
      try {
        const { provider } = stamp;
        const loadedCred = (await axios.get(streamUrl)) as { data: { state: { content: VerifiableCredential } } };
        return {
          provider,
          credential: loadedCred.data.state.content,
          streamId,
        } as Stamp;
      } catch (e) {
        if (e?.response?.data?.error?.includes("CACAO has expired")) {
          cacaoErrorStampIds.push(streamId);
        }
        this.logger.error(`Error when loading stamp with streamId ${streamId} for did  ${this.did}:` + e.toString(), {
          error: e,
        });
        throw e;
      }
    });

    const successfulStamps = await getFulfilledPromises(stampsToLoad);

    return {
      successfulStamps,
      cacaoErrorStampIds,
    };
  }

  async addStamp(stamp: Stamp): Promise<void> {
    this.logger.info(`adding stamp to did ${this.did}`);
    // get passport document from user did data store in ceramic
    const passport = await this.store.get("Passport");

    // ensure the users did matches the credentials subject id otherwise skip the save
    if (passport && this.did === stamp.credential.credentialSubject.id.toLowerCase()) {
      // create a tile for verifiable credential issued from iam server
      const newStampTile = await this.model.createTile("VerifiableCredential", stamp.credential);

      // add stamp provider and streamId to passport stamps array
      const newStamps = passport?.stamps.concat({ provider: stamp.provider, credential: newStampTile.id.toUrl() });

      // merge new stamps array to update stamps on the passport
      const streamId = await this.store.merge("Passport", { stamps: newStamps });

      // try pinning passport
      try {
        await this.ceramicClient.pin.add(streamId);
      } catch (e) {
        this.logger.error(`Error when pinning passport for did  ${this.did}:` + e.toString());
      }
    }
  }

  async addStamps(stamps: Stamp[]): Promise<void> {
    this.logger.info(`adding stamps to did ${this.did}`);
    // get passport document from user did data store in ceramic
    const passport = await this.store.get("Passport");

    // add stamp provider and streamId to passport stamps array
    const newStamps = passport?.stamps.concat(
      // write all stamps to ceramic as tiles and collate CeramicStamp definitions
      (
        await Promise.all(
          stamps.map(async (stamp): Promise<CeramicStamp | undefined> => {
            // ensure the users did matches the credentials subject id otherwise skip the save
            if (passport && this.did === stamp.credential.credentialSubject.id.toLowerCase()) {
              // create a tile for verifiable credential issued from iam server
              const newStampTile = await this.model.createTile("VerifiableCredential", stamp.credential);

              return { provider: stamp.provider, credential: newStampTile.id.toUrl() };
            }
          })
        )
      ).filter((v: CeramicStamp | undefined) => v)
    );

    // merge new stamps array to update stamps on the passport
    const streamId = await this.store.merge("Passport", { stamps: newStamps });

    // try pinning passport
    try {
      await this.ceramicClient.pin.add(streamId);
    } catch (e) {
      this.logger.error(`Error when pinning passport for did  ${this.did}:` + e.toString());
    }
  }

  // Update stamps by providerIds
  async deleteStamps(providerIds: PROVIDER_ID[]): Promise<void> {
    this.logger.info(`updating stamp(s) on ${this.did}`);

    const passport = await this.store.get("Passport");

    // filter Passport stamp list by the platform's providerIds
    if (passport && passport.stamps) {
      await Promise.all(
        passport.stamps.map(async (stamp) => {
          const regex = /ceramic:\/*/i;
          const cred = stamp.credential.replace(regex, "");

          if (providerIds.includes(stamp.provider as PROVIDER_ID)) {
            await this.deleteStamp(cred);
          }
        })
      );

      const updatedStamps = passport.stamps.filter((stamp) => !providerIds.includes(stamp.provider as PROVIDER_ID));

      // overwrite stamps array with updated stamps on the passport
      const streamId = await this.store.set("Passport", { stamps: updatedStamps });

      // try pinning passport
      try {
        await this.ceramicClient.pin.add(streamId);
      } catch (e) {
        this.logger.error(`Error when pinning passport for did  ${this.did}:` + e.toString());
      }
    }
  }

  async deleteStamp(streamId: string): Promise<void> {
    return this.deleteStampIDs([streamId]);
  }

  async deleteStampIDs(streamIds: string[]): Promise<void> {
    this.logger.info(`deleting stamp(s) ${streamIds.join(", ")} from did ${this.did}`);
    // get passport document from user did data store in ceramic
    const passport = await this.store.get("Passport");

    if (passport && passport.stamps) {
      const [stampsToDelete, stampsToKeep] = partition(passport.stamps, (stamp) =>
        streamIds.includes(stamp.credential)
      );

      // merge new stamps array to update stamps on the passport
      const passportStreamId = await this.store.merge("Passport", { stamps: stampsToKeep });

      await Promise.all(
        stampsToDelete.map(async (stamp) => {
          // try to unpin the stamp
          const stampStreamId: StreamID = StreamID.fromString(stamp.credential);
          try {
            return await this.ceramicClient.pin.rm(stampStreamId);
          } catch (e) {
            this.logger.error(
              `Error when unpinning stamp with id ${stampStreamId.toString()} for did  ${this.did}:` + e.toString()
            );
          }
        })
      );

      try {
        await this.ceramicClient.pin.add(passportStreamId);
      } catch (e) {
        this.logger.error(`Error when pinning passport for did  ${this.did}:` + e.toString());
      }

      const missingStamps = streamIds.filter(
        (streamId) => !stampsToDelete.find((stamp) => stamp.credential === streamId)
      );
      if (missingStamps.length)
        this.logger.info(`unable to find stamp with stream id(s) ${missingStamps.join(", ")} in passport`);
    }
  }

  async deletePassport(): Promise<void> {
    this.logger.info(`deleting passport for did ${this.did}`);
    // Created for development purposes
    await this.store.remove("Passport");
  }
}

async function getFulfilledPromises<T>(promises: Promise<T>[]): Promise<T[]> {
  const promiseStatuses = await Promise.allSettled(promises);

  // Filter out only the successful promises
  const isFulfilled = <T>(input: PromiseSettledResult<T>): input is PromiseFulfilledResult<T> =>
    input.status === "fulfilled";

  const fulfilledPromises = promiseStatuses.filter(isFulfilled);

  return fulfilledPromises.map((fulfilledPromise) => fulfilledPromise.value);
}

function partition<T>(arr: T[], test: (elem: T) => boolean): [T[], T[]] {
  const pass: T[] = [];
  const fail: T[] = [];

  arr.map((elem) => (test(elem) ? pass.push(elem) : fail.push(elem)));

  return [pass, fail];
}
