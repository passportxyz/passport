import { CeramicClient } from "@ceramicnetwork/http-client";
import { PassportWithErrors } from "./../../types/src/index.d";
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
import { Stream } from "@ceramicnetwork/common";

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

jest.setTimeout(30000);

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

    const passport = (await ceramicDatabase.getPassport()) as PassportWithErrors;

    // We do not expect to have any passport, hence `false` should be returned
    expect(spyStoreGet).toBeCalledTimes(1);
    expect(spyStoreGet).toBeCalledWith("Passport");
    expect(spyLoadStreamReq).toBeCalledTimes(3);
    expect(spyStoreGetRecordDocument).toBeCalledTimes(1);

    // Ensure the document is pinned
    expect(spyPinAdd).toBeCalledTimes(1);
    expect(spyPinAdd).toBeCalledWith("passport-id");

    expect(passport.passport?.stamps).toEqual([
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
    expect(passport.passport?.issuanceDate).toEqual(issuanceDate);
    expect(passport.passport?.expiryDate).toEqual(expiryDate);
  });

  describe("when stamps cannot successfully be loaded from ceramic", () => {
    let spyAxiosGet, spyStoreGet, spyStoreGetRecordDocument, spyPinAdd, issuanceDate, expiryDate;
    const parseStreamIdFromUrl = (url: string) => url.split("/").slice(-1);

    beforeEach(() => {
      issuanceDate = new Date("2022-06-01");
      expiryDate = new Date("2022-09-01");

      spyStoreGet = jest.spyOn(ceramicDatabase.store, "get").mockImplementation(async (name) => {
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
      spyStoreGetRecordDocument = jest
        .spyOn(ceramicDatabase.store, "getRecordDocument")
        .mockImplementation(async (name) => {
          return {
            id: "passport-id",
          } as unknown as TileDoc;
        });

      spyAxiosGet = jest.spyOn(axios, "get");

      spyPinAdd = jest.spyOn(ceramicDatabase.ceramicClient.pin, "add").mockImplementation(async (streamId) => {
        // Nothing to do here
        return;
      });
    });

    it("ignores unsuccessful stamps", async () => {
      const maxGoodStamps = 2;
      let numGoodStamps = 0;

      spyAxiosGet.mockImplementation(async (url: string): Promise<{}> => {
        const streamId = parseStreamIdFromUrl(url);
        if (numGoodStamps < maxGoodStamps) {
          numGoodStamps += 1;
          return {
            data: {
              state: {
                content: "Stamp Content for ceramic://" + streamId,
              },
            },
            status: 200,
          };
        }
        throw "Error loading stamp!";
      });

      const passport = (await ceramicDatabase.getPassport()) as PassportWithErrors;

      // We do not expect to have any passport, hence `false` should be returned
      expect(spyStoreGet).toBeCalledTimes(1);
      expect(spyStoreGet).toBeCalledWith("Passport");
      expect(spyAxiosGet).toBeCalledTimes(3);
      expect(spyStoreGetRecordDocument).toBeCalledTimes(1);

      // Ensure the document is pinned
      expect(spyPinAdd).toBeCalledTimes(1);
      expect(spyPinAdd).toBeCalledWith("passport-id");

      // We only expect 2 stamps to have been loaded
      expect(passport.passport?.stamps).toEqual([
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
      expect(passport.passport?.issuanceDate).toEqual(issuanceDate);
      expect(passport.passport?.expiryDate).toEqual(expiryDate);
    });

    it("records the stream index when a stamp has a CACAO error", async () => {
      spyAxiosGet
        .mockImplementationOnce(async (): Promise<{}> => {
          throw { response: { data: { error: "CACAO has expired" } } };
        })
        .mockImplementation(async (url: string): Promise<{}> => {
          return {
            data: {
              state: {
                content: "Stamp Content for ceramic://" + parseStreamIdFromUrl(url),
              },
            },
            status: 200,
          };
        });

      const passport = (await ceramicDatabase.getPassport()) as PassportWithErrors;

      expect(spyAxiosGet).toBeCalledTimes(3);

      expect(passport.passport?.stamps).toEqual([
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

      expect(passport.errors?.error).toBe(true);
      expect(passport.errors?.stamps).toEqual(["ceramic://credential-1"]);
    });
  });
  it("checkPassportCACAOError should indicate if a passport stream is throwing a CACAO error", async () => {
    jest
      .spyOn(ceramicDatabase.store, "getRecordID")
      .mockImplementation(async (name) => "passport-id" as unknown as string);

    let spyStoreGetRecordDocument = jest
      .spyOn(ceramicDatabase.store, "getRecordDocument")
      .mockImplementation(async (name) => {
        return {
          id: "passport-id",
        } as unknown as TileDoc;
      });

    const spyLoadStreamReq = jest.spyOn(axios, "get").mockImplementation((url: string): Promise<{}> => {
      return new Promise((resolve, reject) => {
        reject({
          response: {
            data: {
              error: "CACAO has expired",
            },
          },
          status: 500,
        });
      });
    });

    expect(ceramicDatabase.checkPassportCACAOError()).resolves.toBe(true);
  });

  it("checkPassportCACAOError should not indicate cacao error if not present", () => {
    jest.spyOn(ceramicDatabase.store, "getRecordDocument").mockImplementation(async (name) => {
      return {
        id: "passport-id",
      } as unknown as TileDoc;
    });

    jest.spyOn(axios, "get").mockImplementation((url: string): Promise<{}> => {
      return new Promise((resolve, reject) => {
        reject({
          response: {
            data: {
              error: "Timeout",
            },
          },
          status: 504,
        });
      });
    });
    expect(ceramicDatabase.checkPassportCACAOError()).resolves.toBe(false);
  });
  it("should attempt to refresh a passport until successful", async () => {
    jest
      .spyOn(ceramicDatabase.store, "getRecordID")
      .mockImplementation(async (name) => "passport-id" as unknown as string);

    jest.spyOn(ceramicDatabase.store, "getRecordDocument").mockImplementation(async (name) => {
      return {
        id: "passport-id",
      } as unknown as TileDoc;
    });

    const spyLoadStream = jest.spyOn(ceramicDatabase.ceramicClient, "loadStream");

    spyLoadStream.mockImplementationOnce(() => {
      throw new Error("CACAO expired: Commit...") as unknown as Stream;
    });

    spyLoadStream.mockImplementationOnce((streamId) => {
      return new Promise((resolve, reject) => {
        resolve("true" as unknown as Stream);
      });
    });

    await ceramicDatabase.refreshPassport();

    expect(spyLoadStream).toBeCalledTimes(2);
  });
});
