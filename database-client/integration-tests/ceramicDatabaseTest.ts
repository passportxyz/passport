import { Passport, VerifiableCredential, Stamp, PROVIDER_ID } from "@dpopp/types";
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
});

describe("when there is an existing passport with out stamps for the given did", () => {
  const existingPassport: Passport = {
    issuanceDate: new Date("2022-01-01"),
    expiryDate: new Date("2022-01-02"),
    stamps: [],
  };

  let existingPassportStreamID;
  beforeEach(async () => {
    const stream = await ceramicDatabase.store.set("Passport", existingPassport);
    existingPassportStreamID = stream.toUrl();
  });

  afterEach(async () => {
    await ceramicDatabase.store.remove("Passport");
  });

  it("getPassport retrieves the passport from ceramic", async () => {
    const actualPassport = await ceramicDatabase.getPassport();

    expect(actualPassport).toBeDefined();
    expect(actualPassport).toEqual(existingPassport);
    expect(actualPassport.stamps).toEqual([]);
  });

  it("addStamp adds a stamp to passport", async () => {
    const credential: VerifiableCredential = {
      "@context": ["https://www.w3.org/2018/credentials/v1"],
      type: ["VerifiableCredential"],
      credentialSubject: {
        id: "did:ethr:Simple",
        "@context": [
          {
            root: "https://schema.org/Text",
          },
        ],
        root: "randomValuesRoot",
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
  };

  const credential: VerifiableCredential = {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential"],
    credentialSubject: {
      id: "did:ethr:Simple",
      "@context": [
        {
          root: "https://schema.org/Text",
        },
      ],
      root: "randomValuesRoot",
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

  const simpleStampFixture: Stamp = {
    provider: "Simple",
    credential,
  };

  const googleStampFixture: Stamp = {
    provider: "Google",
    credential,
  };

  let existingPassportStreamID;
  beforeEach(async () => {
    // create a tile for verifiable credential issued from iam server
    const simpleStampTile = await ceramicDatabase.model.createTile("VerifiableCredential", credential);
    // add simple stamp provider and streamId to passport stamps array
    const existingPassportWithStamps = {
      ...existingPassport,
      stamps: [
        {
          provider: simpleStampFixture.provider,
          credential: simpleStampTile.id.toUrl(),
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
    const actualPassport = await ceramicDatabase.getPassport();

    const formattedDate = new Date(actualPassport["issuanceDate"]);
    const todaysDate = new Date();

    expect(actualPassport).toBeDefined();
    expect(formattedDate.getDay).toEqual(todaysDate.getDay);
    expect(formattedDate.getMonth).toEqual(todaysDate.getMonth);
    expect(formattedDate.getFullYear).toEqual(todaysDate.getFullYear);
    expect(actualPassport.stamps[0]).toEqual(simpleStampFixture);
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
