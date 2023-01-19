import { TileDocument } from '@ceramicnetwork/stream-tile';
import { DID, PassportWithErrors, PROVIDER_ID, Stamp, VerifiableCredential, PassportError, Passport } from "@gitcoin/passport-types";

// -- Ceramic and Glazed
import type { CeramicApi, Stream } from "@ceramicnetwork/common";
import {SyncOptions} from "@ceramicnetwork/common";
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

  async refreshStream(streamId: string): Promise<boolean> {
    let attempts = 1;
    let success = false;
    // Attempt to load stream 36 times, with 5 second delay between each attempt - 5 min total
    while (attempts < 36 && !success) {
      const options = attempts === 1 ? { sync: SyncOptions.SYNC_ALWAYS, syncTimeoutSeconds: 5 } : {  };
      try {
        const stream = await this.ceramicClient.loadStream<TileDocument>(streamId, options);
        success = true;
        return success;
      } catch (e) {
        this.logger.error(`Error when calling loadStream on ${streamId}, attempt ${attempts}`, e);
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
    return false;
  }

  async getPassport(): Promise<PassportWithErrors | undefined | false> {
    const errors: PassportError = {
      error: false,
      stamps: [],
    }
    try {
      const passport = await this.store.get("Passport");
      this.logger.info(`loaded passport for did ${this.did} => ${JSON.stringify(passport)}`);
      if (!passport) return false;

      // According to the logs, it does happen that passport is sometimes an empty object {}
      // We treat this case as an non-existent passport
      if (!passport.stamps) return false;

      const streamIDs: string[] = passport?.stamps.map((ceramicStamp: CeramicStamp) => {
        return ceramicStamp.credential;
      });

      // `stamps` is stored as ceramic URLs - must load actual VC data from URL
      const stampsToLoad = passport?.stamps.map(async (_stamp, idx) => {
        const streamUrl = `${this.apiHost}/api/v0/streams/${streamIDs[idx].substring(10)}`;
        this.logger.log(`get stamp from streamUrl: ${streamUrl}`);
        try {
          const { provider, credential } = _stamp;
          const loadedCred = (await axios.get(streamUrl)) as { data: { state: { content: VerifiableCredential } } };
          return {
            provider,
            credential: loadedCred.data.state.content,
            streamId: streamIDs[idx],
          } as Stamp;
        } catch (e) {
          this.logger.error(
            `Error when loading stamp with streamId ${streamIDs[idx]} for did  ${this.did}:` + e.toString()
          );
          if (e.response.data.error.includes("CACAO has expired")) {
            errors.error = true;
            errors.stamps.push(streamIDs[idx]) 
          }
          throw e;
        }
      });

      // Wait for all stamp loading to be settled
      const stampLoadingStatus = await Promise.allSettled(stampsToLoad);

      // Filter out only the successfully loaded stamps
      const isFulfilled = <T>(input: PromiseSettledResult<T>): input is PromiseFulfilledResult<T> =>
        input.status === "fulfilled";
      const filteredStamps = stampLoadingStatus.filter(isFulfilled);
      const loadedStamps = filteredStamps.map((settledStamp) => settledStamp.value);

      const parsedPassport: Passport = {
        issuanceDate: new Date(passport.issuanceDate),
        expiryDate: new Date(passport.expiryDate),
        stamps: loadedStamps,
      };

      // try pinning passport
      try {
        const passportDoc = await this.store.getRecordDocument(this.model.getDefinitionID("Passport"));
        await this.ceramicClient.pin.add(passportDoc.id);
      } catch (e) {
        this.logger.error(`Error when pinning passport for did  ${this.did}:` + e.toString());
      }

      return {
        passport: parsedPassport,
        errors,
      };
    } catch (e) {
      this.logger.error(`Error when loading passport for did  ${this.did}:` + e.toString());
      // errors.error = true;
      // errors.passport = true;
      return {
        passport: undefined,
        errors,
      };
    }
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
    this.logger.info(`deleting stamp ${streamId} from did ${this.did}`);
    // get passport document from user did data store in ceramic
    const passport = await this.store.get("Passport");

    if (passport && passport.stamps) {
      const itemIndex = passport.stamps.findIndex((stamp) => {
        return stamp.credential === streamId;
      });

      if (itemIndex != -1) {
        // Remove the stamp from the stamp list
        passport.stamps.splice(itemIndex, 1);

        // merge new stamps array to update stamps on the passport
        const passportStreamId = await this.store.merge("Passport", { stamps: passport.stamps });

        // try to unpin the stamp
        const stampStreamId: StreamID = StreamID.fromString(streamId);
        try {
          await this.ceramicClient.pin.rm(stampStreamId);
        } catch (e) {
          this.logger.error(
            `Error when unpinning stamp with id ${stampStreamId.toString()} for did  ${this.did}:` + e.toString()
          );
        }

        // try pinning passport
        try {
          await this.ceramicClient.pin.add(passportStreamId);
        } catch (e) {
          this.logger.error(`Error when pinning passport for did  ${this.did}:` + e.toString());
        }
      } else {
        this.logger.info(`unable to find stamp with stream id ${streamId} in passport`);
      }
    }
  }

  async deletePassport(): Promise<void> {
    this.logger.info(`deleting passport for did ${this.did}`);
    // Created for development purposes
    await this.store.remove("Passport");
  }
}
