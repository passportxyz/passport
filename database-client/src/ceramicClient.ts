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

// TODO read this in from env
const CERAMIC_CLIENT_URL = "http://localhost:7007";

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
    // @ts-ignore
    ceramic.setDID(did);
    console.log("Current ceramic did: ", ceramic.did?.id);

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
    // const passportTile = await this.model.createTile("Passport", newPassport);
    // console.log("Created passport tile: ", JSON.stringify(passportTile.id.toUrl()));
    const stream = await this.store.set("Passport", { ...newPassport });
    console.log("Set Passport: ", JSON.stringify(stream.toUrl()));
    return stream.toUrl();
  }
  async getPassport(did?: DID): Promise<Passport | undefined> {
    try {
      const passport = await this.store.get("Passport");
      console.log("Loaded passport: ", JSON.stringify(passport));
      // // `stamps` is stored as ceramic URLs - must load actual VC data from URL
      // const stampsToLoad =
      //   passport?.stamps.map(async (_stamp) => {
      //     const { provider, credential } = _stamp;
      //     const loadedCred = await this.loader.load(credential);
      //     return {
      //       provider,
      //       credential: loadedCred.content,
      //     } as Stamp;
      //   }) ?? [];
      // const loadedStamps = await Promise.all(stampsToLoad);

      return undefined;
    } catch (e) {
      console.error(e);
      return undefined;
    }
  }
  async addStamp(did: DID, stamp: Stamp): Promise<void> {
    console.log("add stamp ceramic");
  }

  async deletePassport(): Promise<void> {
    console.log("remove passport");
  }
}
