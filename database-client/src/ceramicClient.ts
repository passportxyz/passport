import { DID, Passport, Stamp, VerifiableCredential } from "@dpopp/types";

// -- Ceramic and Glazed
import type { CeramicApi } from "@ceramicnetwork/common";
import { CeramicClient } from "@ceramicnetwork/http-client";
import publishedModel from "@dpopp/schemas/scripts/publish-model.json";
import { DataModel } from "@glazed/datamodel";
import { DIDDataStore } from "@glazed/did-datastore";
import { TileLoader } from "@glazed/tile-loader";
import type { DID as CeramicDID } from "dids";

import { DataStorageBase } from "./types";

const CERAMIC_CLIENT_URL = process.env.CERAMIC_CLIENT_URL || "http://localhost:7007";

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

export class CeramicDatabase implements DataStorageBase {
  loader: TileLoader;
  ceramicClient: CeramicApi;
  model: DataModel<ModelTypes>;
  store: DIDDataStore<ModelTypes>;

  constructor(did?: CeramicDID) {
    // Create the Ceramic instance and inject the DID
    const ceramic = new CeramicClient(CERAMIC_CLIENT_URL);
    ceramic.setDID(did);

    // Create the loader, model and store
    const loader = new TileLoader({ ceramic });
    const model = new DataModel({ ceramic, aliases: publishedModel });
    const store = new DIDDataStore({ loader, ceramic, model });

    this.loader = loader;
    this.ceramicClient = ceramic;
    this.model = model;
    this.store = store;
  }

  async createPassport(): Promise<DID> {
    const date = new Date();
    const newPassport: CeramicPassport = {
      issuanceDate: date.toISOString(),
      expiryDate: date.toISOString(),
      stamps: [],
    };
    const stream = await this.store.set("Passport", { ...newPassport });
    return stream.toUrl();
  }
  async getPassport(): Promise<Passport | undefined> {
    try {
      const passport = await this.store.get("Passport");
      if (!passport) return undefined;
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

      return parsePassport;
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }
  async addStamp(stamp: Stamp): Promise<void> {
    // get passport document from user did data store in ceramic
    const passport = await this.store.get("Passport");
    if (passport) {
      // create a tile for verifiable credential issued from iam server
      const newStampTile = await this.model.createTile("VerifiableCredential", stamp.credential);

      // add stamp provider and streamId to passport stamps array
      const newStamps = passport?.stamps.concat({ provider: stamp.provider, credential: newStampTile.id.toUrl() });

      // merge new stamps array to update stamps on the passport
      await this.store.merge("Passport", { stamps: newStamps });
    }
  }

  async deletePassport(): Promise<void> {
    // Created for development purposes
    await this.store.remove("Passport");
  }
}
