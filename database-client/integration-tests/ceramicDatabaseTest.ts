import { Passport } from "@dpopp/types";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";

import { CeramicDatabase } from "../src/ceramicClient";

let testDID: DID;
let ceramicDatabase: CeramicDatabase;

beforeAll(async () => {
  const TEST_SEED = new Uint8Array([
    6, 190, 125, 152, 83, 9, 111, 202, 6, 214, 218, 146, 104, 168, 166, 110, 202, 171, 42, 114, 73, 204, 214, 60, 112,
    254, 173, 151, 170, 254, 250, 2,
  ]);

  // Create and authenticate the DID
  testDID = new DID({
    provider: new Ed25519Provider(TEST_SEED),
    resolver: getResolver(),
  });
  await testDID.authenticate();

  ceramicDatabase = new CeramicDatabase(testDID);
});

afterAll(async () => {
  await ceramicDatabase.store.remove("Passport");
});

describe("when there is no passport for the given did", () => {
  beforeEach(async () => {
    await ceramicDatabase.store.remove("Passport");
  });

  it("createPassport creates a passport in ceramic", async () => {
    const actualPassportStreamID = await ceramicDatabase.createPassport();

    expect(actualPassportStreamID).toBeDefined();

    const storedPassport = (await ceramicDatabase.loader.load(actualPassportStreamID)).content;
    console.log("Stored passport: ", JSON.stringify(storedPassport.content));

    const formattedDate = new Date(storedPassport["issuanceDate"]);
    const todaysDate = new Date();

    expect(formattedDate.getDay).toEqual(todaysDate.getDay);
    expect(formattedDate.getMonth).toEqual(todaysDate.getMonth);
    expect(formattedDate.getFullYear).toEqual(todaysDate.getFullYear);
    expect(storedPassport["stamps"]).toEqual([]);
  });

  it("getPassport returns undefined", async () => {
    const actualPassport = await ceramicDatabase.getPassport();

    expect(actualPassport).toEqual(undefined);
  });

  it("getPassport returns undefined for invalid stream id", async () => {
    const actualPassport = await ceramicDatabase.getPassport("bad id");

    expect(actualPassport).toEqual(undefined);
  });
});

describe("when there is an existing passport for the given did", () => {
  const existingPassport: Passport = {
    issuanceDate: new Date("2022-01-01"),
    expiryDate: new Date("2022-01-02"),
    stamps: [],
  };

  let existingPassportStreamID;
  beforeEach(async () => {
    // actualPassportStreamID = await ceramicDatabase.createPassport();
    const stream = await ceramicDatabase.store.set("Passport", existingPassport);
    existingPassportStreamID = stream.toUrl();
  });

  afterEach(async () => {
    await ceramicDatabase.store.remove("Passport");
  });

  it("getPassport retrieves the passport from ceramic given the stream id", async () => {
    const actualPassport = await ceramicDatabase.getPassport(existingPassportStreamID);

    expect(actualPassport).toBeDefined();
    expect(actualPassport).toEqual(existingPassport);
  });
});
