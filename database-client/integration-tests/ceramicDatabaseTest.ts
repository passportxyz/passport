import { PassportWithErrors } from './../../types/src/index.d';
import { Passport, VerifiableCredential, Stamp, PROVIDER_ID } from "@gitcoin/passport-types";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { jest } from "@jest/globals";
import testnetAliases from "./integration-test-model-aliases.json";

import { CeramicDatabase } from "../src";
import { createCipheriv } from "crypto";

let testDID: DID;
let ceramicDatabase: CeramicDatabase;

jest.setTimeout(30000);

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
    const {passport} = (await ceramicDatabase.getPassport()) as PassportWithErrors;

    expect(passport).toBeDefined();
    expect(passport).toEqual(existingPassport);
    expect(passport.stamps).toEqual([]);
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

    // create a tile for verifiable credential issued from iam server
    const ensStampTile = await ceramicDatabase.model.createTile("VerifiableCredential", credential);

    ensStampFixture = {
      provider: "Ens",
      credential,
      streamId: ensStampTile.id.toUrl(),
    };

    googleStampFixture = {
      provider: "Google",
      credential,
    };

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
    const actualPassport = (await ceramicDatabase.getPassport()) as PassportWithErrors;

    const formattedDate = new Date(actualPassport.passport["issuanceDate"]);

    expect(actualPassport.passport).toBeDefined();
    expect(formattedDate.getDay()).toEqual(existingPassport.issuanceDate.getDay());
    expect(formattedDate.getMonth()).toEqual(existingPassport.issuanceDate.getMonth());
    expect(formattedDate.getFullYear()).toEqual(existingPassport.issuanceDate.getFullYear());
    expect(actualPassport.passport.stamps[0]).toEqual(ensStampFixture);
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

describe("when there is an existing passport with stamps for the given did", () => {
  const existingPassport: Passport = {
    issuanceDate: new Date("2022-01-01"),
    expiryDate: new Date("2022-01-02"),
    stamps: [],
  };

  // these need to be initialized in beforeEach since `credential` needs `ceramicDatabase` to be defined
  let credential: VerifiableCredential;
  let ensStampFixture: Stamp;
  let googleStampFixture: Stamp;
  let poapStampFixture: Stamp;

  let existingPassportStreamID;
  let existingEnsStampTileStreamID: string;
  let existingGoogleStampTileStreamID: string;
  let existingPoapStampTileStreamID: string;
  let providerIds: PROVIDER_ID[];

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

    poapStampFixture = {
      provider: "POAP",
      credential,
    };

    // create the tiles for verifiable credentials
    const ensStampTile = await ceramicDatabase.model.createTile("VerifiableCredential", credential);
    const googleStampTile = await ceramicDatabase.model.createTile("VerifiableCredential", credential);
    const poapStampTile = await ceramicDatabase.model.createTile("VerifiableCredential", credential);
    existingEnsStampTileStreamID = ensStampTile.id.toUrl();
    existingGoogleStampTileStreamID = googleStampTile.id.toUrl();
    existingPoapStampTileStreamID = poapStampTile.id.toUrl();
    providerIds = ["Ens", "Google", "POAP"];

    // add ENS stamp provider and streamId to passport stamps array
    const existingPassportWithStamps = {
      issuanceDate: new Date("2022-01-01"),
      expiryDate: new Date("2022-01-02"),
      stamps: [
        {
          provider: ensStampFixture.provider,
          credential: ensStampTile.id.toUrl(),
        },
        {
          provider: googleStampFixture.provider,
          credential: googleStampTile.id.toUrl(),
        },
        {
          provider: poapStampFixture.provider,
          credential: poapStampTile.id.toUrl(),
        },
      ],
    };

    const stream = await ceramicDatabase.store.set("Passport", existingPassportWithStamps);
    existingPassportStreamID = stream.toUrl();
  });

  afterEach(async () => {
    await ceramicDatabase.store.remove("Passport");
  });

  it("deleteStamps deletes selected stamps from passport", async () => {
    ceramicDatabase.deleteStamps(providerIds);

    // The deletion will not be reflected immediatly, we need to wait a bit ...
    await new Promise((r) => setTimeout(r, 2000));
    const passport = await ceramicDatabase.store.get("Passport");

    expect(passport.stamps.length).toEqual(0);
    expect(
      passport.stamps.findIndex((stamp) => {
        return stamp.credential === existingEnsStampTileStreamID;
      })
    ).toEqual(-1);
    expect(
      passport.stamps.findIndex((stamp) => {
        return stamp.credential === existingPoapStampTileStreamID;
      })
    ).toEqual(-1);
    expect(
      passport.stamps.findIndex((stamp) => {
        return stamp.credential === existingGoogleStampTileStreamID;
      })
    ).toEqual(-1);
  });

  it("deleteStamp deletes an existing stamp from passport", async () => {
    ceramicDatabase.deleteStamp(existingGoogleStampTileStreamID);

    // The deletion will not be reflected immediatly, we need to wait a bit ...
    await new Promise((r) => setTimeout(r, 2000));
    const passport = await ceramicDatabase.store.get("Passport");

    expect(passport.stamps.length).toEqual(2);
    expect(
      passport.stamps.findIndex((stamp) => {
        return stamp.credential === existingEnsStampTileStreamID;
      })
    ).toEqual(0);
    expect(
      passport.stamps.findIndex((stamp) => {
        return stamp.credential === existingPoapStampTileStreamID;
      })
    ).toEqual(1);
    expect(
      passport.stamps.findIndex((stamp) => {
        return stamp.credential === existingGoogleStampTileStreamID;
      })
    ).toEqual(-1);
  });
});

describe("when loading a stamp from a passport fails", () => {
  const existingPassport: Passport = {
    issuanceDate: new Date("2022-01-01"),
    expiryDate: new Date("2022-01-02"),
    stamps: [],
  };

  // these need to be initialized in beforeEach since `credential` needs `ceramicDatabase` to be defined
  let ensCredential: VerifiableCredential;
  let poapCredential: VerifiableCredential;
  let googleCredential: VerifiableCredential;
  let ensStampFixture: Stamp;
  let googleStampFixture: Stamp;
  let poapStampFixture: Stamp;

  let existingPassportStreamID;
  let existingEnsStampTileStreamID: string;
  let existingPoapStampTileStreamID: string;

  beforeEach(async () => {
    const createVC = function (provider: string): VerifiableCredential {
      return {
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
          provider: provider,
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
    };

    ensCredential = createVC("Ens");
    poapCredential = createVC("POAP");
    googleCredential = createVC("Google");

    ensStampFixture = {
      provider: "Ens",
      credential: ensCredential,
    };

    googleStampFixture = {
      provider: "Google",
      credential: googleCredential,
    };

    poapStampFixture = {
      provider: "POAP",
      credential: poapCredential,
    };

    // create the tiles for verifiable credentials
    const ensStampTile = await ceramicDatabase.model.createTile("VerifiableCredential", ensCredential);
    const poapStampTile = await ceramicDatabase.model.createTile("VerifiableCredential", googleCredential);

    existingEnsStampTileStreamID = ensStampTile.id.toUrl();
    existingPoapStampTileStreamID = poapStampTile.id.toUrl();

    // add ENS stamp provider and streamId to passport stamps array
    const existingPassportWithStamps = {
      issuanceDate: new Date("2022-01-01"),
      expiryDate: new Date("2022-01-02"),
      stamps: [
        {
          provider: ensStampFixture.provider,
          credential: ensStampTile.id.toUrl(),
        },
        {
          provider: googleStampFixture.provider,
          credential: "ceramic://SOME_BAD_ID_FOR_CERAMIC",
        },
        {
          provider: poapStampFixture.provider,
          credential: poapStampTile.id.toUrl(),
        },
      ],
    };

    const stream = await ceramicDatabase.store.set("Passport", existingPassportWithStamps);
    existingPassportStreamID = stream.toUrl();
  });

  afterEach(async () => {
    await ceramicDatabase.store.remove("Passport");
  });

  it("ignores the failed stamp and only returns the successfully loaded stamps", async () => {
    const passport = (await ceramicDatabase.getPassport()) as PassportWithErrors;

    // We only expect 2 results: Ens and Google stamps
    expect(passport.passport.stamps.length).toEqual(2);
    expect(
      passport.passport.stamps.findIndex((stamp) => {
        return stamp && stamp.credential.credentialSubject.provider === "Ens";
      })
    ).toEqual(0);
    expect(
      passport.passport.stamps.findIndex((stamp) => {
        return stamp && stamp.credential.credentialSubject.provider === "Google";
      })
    ).toEqual(1);
  });
});
