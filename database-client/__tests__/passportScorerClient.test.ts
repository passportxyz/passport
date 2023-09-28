import axios from "axios";
import { Stamp } from "@gitcoin/passport-types";
import { Logger, PassportDatabase } from "../src";
import { jest } from "@jest/globals";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";

const TEST_SEED = Uint8Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));

const passportScorerUrl = "https://example.com/";
const token = "fake-token";
const address = "0x123456789abcdef";

jest.mock("axios");

const stamps = [
  { provider: "provider1", credential: "credential1" } as unknown as Stamp,
  { provider: "provider2", credential: "credential2" } as unknown as Stamp,
];

let passportDatabase: PassportDatabase;

const logger = {
  info: jest.fn(),
  error: jest.fn(),
};

describe("scorerClient", () => {
  beforeEach(async () => {
    const testDID = new DID({
      provider: new Ed25519Provider(TEST_SEED),
      resolver: getResolver(),
    });

    await testDID.authenticate();
    passportDatabase = new PassportDatabase(passportScorerUrl, address, token, logger as unknown as Logger, testDID);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should call axios.post with the correct url and data", async () => {
    jest.spyOn(axios, "post").mockImplementation((url: string): Promise<{}> => {
      return new Promise((resolve) => {
        resolve({});
      });
    });

    const stampsToSave = stamps.map((stamp) => ({
      provider: stamp.provider,
      stamp: stamp.credential,
    }));

    await passportDatabase.addStamps(stamps);

    expect(logger.info).toHaveBeenCalledWith(`adding stamp to passportScorer address: ${address}`);
    expect(axios.post).toHaveBeenCalledWith(`${passportScorerUrl}/stamps/bulk`, stampsToSave, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  });

  it("should log an error when axios.post fails", async () => {
    const error = new Error("Request failed");
    const request = "post";
    jest.spyOn(axios, request).mockImplementation((url: string): Promise<{}> => {
      return new Promise((_, reject) => {
        reject(error);
      });
    });

    await passportDatabase.addStamps(stamps);

    expect(logger.info).toHaveBeenCalledWith(`adding stamp to passportScorer address: ${address}`);
    expect(logger.error).toHaveBeenCalledWith(
      `[Scorer] Error thrown when making ${request} for passport with did ${address}: Error: Request failed`,
      { error }
    );
  });

  it("should log an error when axios.delete fails", async () => {
    const error = new Error("Request failed");
    const request = "delete";
    jest.spyOn(axios, request).mockImplementation((url: string): Promise<{}> => {
      return new Promise((_, reject) => {
        reject(error);
      });
    });

    const providerIds = stamps.map((stamp) => stamp.provider);
    await passportDatabase.deleteStamps(providerIds);

    expect(logger.info).toHaveBeenCalledWith(
      `deleting stamp from passportScorer for ${providerIds.join(", ")} on ${address}`
    );
    expect(logger.error).toHaveBeenCalledWith(
      `[Scorer] Error thrown when making ${request} for passport with did ${address}: Error: Request failed`,
      { error }
    );
  });

  it("should call axios.patch with the correct url and data", async () => {
    jest.spyOn(axios, "patch").mockImplementation((url: string): Promise<{}> => {
      return new Promise((resolve) => {
        resolve({});
      });
    });

    const stampPatches = [
      {
        credential: stamps[0].credential,
        provider: stamps[0].provider,
      },
      {
        provider: stamps[1].provider,
      },
    ];

    const expectedCalldata = stampPatches.map(({ provider, credential }) => ({
      provider,
      stamp: credential,
    }));

    await passportDatabase.patchStamps(stampPatches);

    expect(logger.info).toHaveBeenCalledWith(`patching stamps in passportScorer for address: ${address}`);
    expect(axios.patch).toHaveBeenCalledWith(`${passportScorerUrl}/stamps/bulk`, expectedCalldata, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  });

  it("should log an error when axios.patch fails", async () => {
    const error = new Error("Request failed");
    const request = "patch";
    jest.spyOn(axios, request).mockImplementation((url: string): Promise<{}> => {
      return new Promise((_, reject) => {
        reject(error);
      });
    });

    await passportDatabase.patchStamps(stamps);

    expect(logger.info).toHaveBeenCalledWith(`patching stamps in passportScorer for address: ${address}`);
    expect(logger.error).toHaveBeenCalledWith(
      `[Scorer] Error thrown when making ${request} for passport with did ${address}: ${error.toString()}`,
      { error }
    );
  });
});
