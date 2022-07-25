import { DID, Passport, Stamp, VerifiableCredential } from "@gitcoin/passport-types";

// -- Ceramic and Glazed
import type { CeramicApi } from "@ceramicnetwork/common";
import { CeramicClient } from "@ceramicnetwork/http-client";
import publishedModel from "@gitcoin/passport-schemas/scripts/publish-model.json";
import { DataModel } from "@glazed/datamodel";
import { DIDDataStore } from "@glazed/did-datastore";
import { TileLoader } from "@glazed/tile-loader";
import type { DID as CeramicDID } from "dids";

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

  constructor(did?: CeramicDID, ceramicHost?: string, aliases?: any, logger?: Logger) {
    if (logger) {
      this.logger = logger;
    } else {
      this.logger = console;
    }

    // Create the Ceramic instance and inject the DID
    const ceramic = new CeramicClient(ceramicHost ?? COMMUNITY_TESTNET_CERAMIC_CLIENT_URL);
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
  async getPassport(): Promise<Passport | undefined | false> {
    try {
      const passport = await this.store.get("Passport");
      this.logger.info(`loaded passport for did ${this.did} => ${JSON.stringify(passport)}`);
      if (!passport) return false;

      // According to the logs, it does happen that passport is sometimes an empty object {}
      // We treat this case as an non-existent passport
      if (!passport.stamps) return false;

      // `stamps` is stored as ceramic URLs - must load actual VC data from URL
      const stampsToLoad =
        passport?.stamps.map(async (_stamp) => {
          const { provider, credential } = _stamp;
          const loadedCred = await this.loader.load(credential);
          return {
            provider,
            credential: loadedCred.content,
          } as Stamp;
        }) ?? [];
      const loadedStamps = await Promise.all(stampsToLoad);

      const parsePassport: Passport = {
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

      return parsePassport;
    } catch (e) {
      this.logger.error(`Error when loading passport for did  ${this.did}:` + e.toString());
      return undefined;
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

  async deletePassport(): Promise<void> {
    this.logger.info(`deleting passport for did ${this.did}`);
    // Created for development purposes
    await this.store.remove("Passport");
  }
}
