import { Passport, VerifiableCredential, Stamp, PROVIDER_ID } from "@gitcoin/passport-types";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { jest } from "@jest/globals";
import { CeramicDatabase } from "../src";

import testnetAliases from "./integration-test-model-aliases.json";
import { TileDocument } from "@ceramicnetwork/stream-tile";
import { TileDoc } from "@glazed/did-datastore/dist/proxy";

import axios from "axios";

let testDID: DID;
let ceramicDatabase: CeramicDatabase;

beforeAll(async () => {
  const TEST_SEED = Uint8Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));

  // Create and authenticate the DID
  testDID = new DID({
    provider: new Ed25519Provider(TEST_SEED),
    resolver: getResolver(),
  });
  await testDID.authenticate();

  ceramicDatabase = new CeramicDatabase(testDID, process.env.CERAMIC_CLIENT_URL, testnetAliases);
});

describe("Verify Ceramic Database", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles failure to read null passport", async () => {
    let spyStoreGet = jest.spyOn(ceramicDatabase.store, "get").mockImplementation(async (name) => {
      return null;
    });

    const passport = await ceramicDatabase.getPassport();

    // We do not expect to have any passport, hence `false` should be returned
    expect(passport).toEqual(false);
    expect(spyStoreGet).toBeCalledTimes(1);
    expect(spyStoreGet).toBeCalledWith("Passport");
  });

  it("handles failure to read an empty passport (no stamps attribute)", async () => {
    let spyStoreGet = jest.spyOn(ceramicDatabase.store, "get").mockImplementation(async (name) => {
      return {};
    });

    const passport = await ceramicDatabase.getPassport();

    // We do not expect to have any passport, hence `false` should be returned
    expect(passport).toEqual(false);
    expect(spyStoreGet).toBeCalledTimes(1);
    expect(spyStoreGet).toBeCalledWith("Passport");
  });

  it("handles reading passport with stamps", async () => {
    const issuanceDate = new Date("2022-06-01");
    const expiryDate = new Date("2022-09-01");
    let spyStoreGet = jest.spyOn(ceramicDatabase.store, "get").mockImplementation(async (name) => {
      return {
        id: "passport-id",
        issuanceDate,
        expiryDate,
        stamps: [
          {
            provider: "Provider-1",
            credential: "ceramic://credential-1",
          },
          {
            provider: "Provider-2",
            credential: "ceramic://credential-2",
          },
          {
            provider: "Provider-3",
            credential: "ceramic://credential-3",
          },
        ],
      };
    });
    let spyStoreGetRecordDocument = jest
      .spyOn(ceramicDatabase.store, "getRecordDocument")
      .mockImplementation(async (name) => {
        return {
          id: "passport-id",
        } as unknown as TileDoc;
      });
    const spyLoadStreamReq = jest.spyOn(axios, "get").mockImplementation((url: string): Promise<{}> => {
      return new Promise((resolve) => {
        const urlSegments = url.split("/");
        const streamId = urlSegments[urlSegments.length - 1];
        resolve({
          data: {
            state: {
              content: "Stamp Content for ceramic://" + streamId,
            },
          },
          status: 200,
        });
      });
    });

    let spyPinAdd = jest.spyOn(ceramicDatabase.ceramicClient.pin, "add").mockImplementation(async (streamId) => {
      // Nothing to do here
      return;
    });

    const passport = (await ceramicDatabase.getPassport()) as Passport;

    // We do not expect to have any passport, hence `false` should be returned
    expect(spyStoreGet).toBeCalledTimes(1);
    expect(spyStoreGet).toBeCalledWith("Passport");
    expect(spyLoadStreamReq).toBeCalledTimes(3);
    expect(spyStoreGetRecordDocument).toBeCalledTimes(1);

    // Ensure the document is pinned
    expect(spyPinAdd).toBeCalledTimes(1);
    expect(spyPinAdd).toBeCalledWith("passport-id");

    expect(passport?.stamps).toEqual([
      {
        credential: "Stamp Content for ceramic://credential-1",
        provider: "Provider-1",
        streamId: "ceramic://credential-1",
      },
      {
        credential: "Stamp Content for ceramic://credential-2",
        provider: "Provider-2",
        streamId: "ceramic://credential-2",
      },
      {
        credential: "Stamp Content for ceramic://credential-3",
        provider: "Provider-3",
        streamId: "ceramic://credential-3",
      },
    ]);
    expect(passport?.issuanceDate).toEqual(issuanceDate);
    expect(passport?.expiryDate).toEqual(expiryDate);
  });

  it.skip("ignores stamps that cannot be loaded succefully from ceramic", async () => {
    const issuanceDate = new Date("2022-06-01");
    const expiryDate = new Date("2022-09-01");
    const maxGoodStamps = 2;
    let numGoodStamps = 0;
    let spyStoreGet = jest.spyOn(ceramicDatabase.store, "get").mockImplementation(async (name) => {
      return {
        id: "passport-id",
        issuanceDate,
        expiryDate,
        stamps: [
          {
            provider: "Provider-1",
            credential: "ceramic://credential-1",
          },
          {
            provider: "Provider-2",
            credential: "ceramic://credential-2",
          },
          {
            provider: "Provider-3",
            credential: "ceramic://credential-3",
          },
        ],
      };
    });
    let spyStoreGetRecordDocument = jest
      .spyOn(ceramicDatabase.store, "getRecordDocument")
      .mockImplementation(async (name) => {
        return {
          id: "passport-id",
        } as unknown as TileDoc;
      });
    const spyLoadStreamReq = jest.spyOn(axios, "get").mockImplementation((url: string): Promise<{}> => {
      return new Promise((resolve, reject) => {
        const urlSegments = url.split("/");
        const streamId = urlSegments[urlSegments.length - 1];
        if (numGoodStamps < maxGoodStamps) {
          numGoodStamps += 1;
          resolve({
            data: {
              state: {
                content: "Stamp Content for ceramic://" + streamId,
              },
            },
            status: 200,
          });
        }
        reject("Error loading stamp!");
      });
    });

    let spyPinAdd = jest.spyOn(ceramicDatabase.ceramicClient.pin, "add").mockImplementation(async (streamId) => {
      // Nothing to do here
      return;
    });

    const passport = (await ceramicDatabase.getPassport()) as Passport;

    // We do not expect to have any passport, hence `false` should be returned
    expect(spyStoreGet).toBeCalledTimes(1);
    expect(spyStoreGet).toBeCalledWith("Passport");
    expect(spyLoadStreamReq).toBeCalledTimes(3);
    expect(spyStoreGetRecordDocument).toBeCalledTimes(1);

    // Ensure the document is pinned
    expect(spyPinAdd).toBeCalledTimes(1);
    expect(spyPinAdd).toBeCalledWith("passport-id");

    // We only expect 2 stamps to have been loaded
    expect(passport?.stamps).toEqual([
      {
        credential: "Stamp Content for ceramic://credential-1",
        provider: "Provider-1",
        streamId: "ceramic://credential-1",
      },
      {
        credential: "Stamp Content for ceramic://credential-2",
        provider: "Provider-2",
        streamId: "ceramic://credential-2",
      },
    ]);
    expect(passport?.issuanceDate).toEqual(issuanceDate);
    expect(passport?.expiryDate).toEqual(expiryDate);
  });
});
