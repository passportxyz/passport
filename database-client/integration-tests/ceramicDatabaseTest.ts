import { Passport, VerifiableCredential, Stamp, PROVIDER_ID } from "@gitcoin/passport-types";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";

import testnetAliases from "./integration-test-model-aliases.json";

import { CeramicDatabase } from "../src";

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

    const formattedDate = new Date(storedPassport["issuanceDate"]);
    const todaysDate = new Date();

    expect(formattedDate.getDay()).toEqual(todaysDate.getDay());
    expect(formattedDate.getMonth()).toEqual(todaysDate.getMonth());
    expect(formattedDate.getFullYear()).toEqual(todaysDate.getFullYear());
    expect(storedPassport["stamps"]).toEqual([]);
  });

  it("getPassport returns false", async () => {
    const actualPassport = await ceramicDatabase.getPassport();

    expect(actualPassport).toEqual(false);
  });
});

describe("when there is an existing passport without stamps for the given did", () => {
  const existingPassport: Passport = {
    issuanceDate: new Date("2022-01-01"),
    expiryDate: new Date("2022-01-02"),
    stamps: [],
    streamIDs: [],
  };

  let existingPassportStreamID;
  beforeEach(async () => {
    // ceramicPassport follows the schema definition that ceramic expects
    const ceramicPassport = {
      issuanceDate: existingPassport.issuanceDate,
      expiryDate: existingPassport.expiryDate,
      stamps: existingPassport.stamps,
    };
    const stream = await ceramicDatabase.store.set("Passport", ceramicPassport);
    existingPassportStreamID = stream.toUrl();
  });

  afterEach(async () => {
    await ceramicDatabase.store.remove("Passport");
  });

  it("getPassport retrieves the passport from ceramic", async () => {
    const actualPassport = (await ceramicDatabase.getPassport()) as Passport;

    expect(actualPassport).toBeDefined();
    expect(actualPassport).toEqual(existingPassport);
    expect(actualPassport.stamps).toEqual([]);
  });

  it("addStamp adds a stamp to passport", async () => {
    const credential: VerifiableCredential = {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential"],
      credentialSubject: {
        id: `${ceramicDatabase.did}`,
        "@context": [
          {
            hash: "https://schema.org/Text",
            provider: "https://schema.org/Text",
          },
        ],
        hash: "randomValuesHash",
        provider: "randomValuesProvider",
      },
      issuer: "did:key:randomValuesIssuer",
      issuanceDate: "2022-04-15T21:04:01.708Z",
      proof: {
        type: "Ed25519Signature2018",
        proofPurpose: "assertionMethod",
        verificationMethod: "did:key:randomValues",
        created: "2022-04-15T21:04:01.708Z",
        jws: "randomValues",
      },
      expirationDate: "2022-05-15T21:04:01.708Z",
    };

    const googleStampFixture: Stamp = {
      provider: "Google",
      credential,
    };

    await ceramicDatabase.addStamp(googleStampFixture);
    const passport = await ceramicDatabase.store.get("Passport");
    const retrievedStamp = passport?.stamps[0];

    // retrieve streamId stored in credential to load verifiable credential
    const loadedCred = await ceramicDatabase.loader.load(retrievedStamp.credential);

    expect(passport.stamps.length).toEqual(1);
    expect(loadedCred.content as VerifiableCredential).toEqual(credential);
    expect(retrievedStamp.provider as PROVIDER_ID).toEqual(googleStampFixture.provider);
  });
});

describe("when there is an existing passport with stamps for the given did", () => {
  const existingPassport: Passport = {
    issuanceDate: new Date("2022-01-01"),
    expiryDate: new Date("2022-01-02"),
    stamps: [],
    streamIDs: [],
  };

  // these need to be initialized in beforeEach since `credential` needs `ceramicDatabase` to be defined
  let credential: VerifiableCredential;
  let ensStampFixture: Stamp;
  let googleStampFixture: Stamp;

  let existingPassportStreamID;
  beforeEach(async () => {
    credential = {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential"],
      credentialSubject: {
        id: `${ceramicDatabase.did}`,
        "@context": [
          {
            hash: "https://schema.org/Text",
            provider: "https://schema.org/Text",
          },
        ],
        hash: "randomValuesHash",
        provider: "randomValuesProvider",
      },
      issuer: "did:key:randomValuesIssuer",
      issuanceDate: "2022-04-15T21:04:01.708Z",
      proof: {
        type: "Ed25519Signature2018",
        proofPurpose: "assertionMethod",
        verificationMethod: "did:key:randomValues",
        created: "2022-04-15T21:04:01.708Z",
        jws: "randomValues",
      },
      expirationDate: "2022-05-15T21:04:01.708Z",
    };

    ensStampFixture = {
      provider: "Ens",
      credential,
    };

    googleStampFixture = {
      provider: "Google",
      credential,
    };

    // create a tile for verifiable credential issued from iam server
    const ensStampTile = await ceramicDatabase.model.createTile("VerifiableCredential", credential);
    // add ENS stamp provider and streamId to passport stamps array
    const existingPassportWithStamps = {
      issuanceDate: new Date("2022-01-01"),
      expiryDate: new Date("2022-01-02"),
      stamps: [
        {
          provider: ensStampFixture.provider,
          credential: ensStampTile.id.toUrl(),
        },
      ],
    };

    const stream = await ceramicDatabase.store.set("Passport", existingPassportWithStamps);
    existingPassportStreamID = stream.toUrl();
  });

  afterEach(async () => {
    await ceramicDatabase.store.remove("Passport");
  });

  it("getPassport retrieves the passport and stamps from ceramic", async () => {
    const actualPassport = (await ceramicDatabase.getPassport()) as Passport;

    const formattedDate = new Date(actualPassport["issuanceDate"]);

    expect(actualPassport).toBeDefined();
    expect(formattedDate.getDay()).toEqual(existingPassport.issuanceDate.getDay());
    expect(formattedDate.getMonth()).toEqual(existingPassport.issuanceDate.getMonth());
    expect(formattedDate.getFullYear()).toEqual(existingPassport.issuanceDate.getFullYear());
    expect(actualPassport.stamps[0]).toEqual(ensStampFixture);
  });

  it("addStamp adds a stamp to passport", async () => {
    await ceramicDatabase.addStamp(googleStampFixture);

    const passport = await ceramicDatabase.store.get("Passport");

    const retrievedStamp = passport?.stamps[1];

    // retrieve streamId stored in credential to load verifiable credential
    const loadedCred = await ceramicDatabase.loader.load(retrievedStamp.credential);

    expect(passport.stamps.length).toEqual(2);
    expect(loadedCred.content as VerifiableCredential).toEqual(credential);
    expect(retrievedStamp.provider as PROVIDER_ID).toEqual(googleStampFixture.provider);
  });
});
