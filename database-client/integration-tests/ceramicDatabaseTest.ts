import { Stamp, StampPatch } from "@gitcoin/passport-types";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { jest } from "@jest/globals";
import mockStamps from "../__mock__/mockStamps.js";
import mockStampsWithNullifiers from "../__mock__/mockStampsWithNullifiers.js";

import { ComposeDatabase } from "../src/index.js";

let testDID: DID;
let composeDatabase: ComposeDatabase;

jest.setTimeout(180000);

const stampsWithHashToPatch: StampPatch[] = [mockStamps[0] as StampPatch];
const stampsWithHashToAdd: Stamp[] = [mockStamps[1] as Stamp];
const stampsWithNullifiersToPatch: Stamp[] = [mockStampsWithNullifiers[0]];
const stampsWithNullifiersToAdd: Stamp[] = [mockStampsWithNullifiers[1]];
const badStamp = JSON.parse(JSON.stringify(mockStamps[2])) as Stamp;
// @ts-ignore: ignore the error, we want to create an invalid stamp for testing
delete badStamp.credential.issuer;

const testStamps = [
  { credentialType: "with hash", stampsToAdd: stampsWithHashToAdd, stampsToPatch: stampsWithHashToPatch },
  {
    credentialType: "with nullifier",
    stampsToAdd: stampsWithNullifiersToAdd,
    stampsToPatch: stampsWithNullifiersToPatch,
  },
];
describe.skip.each(testStamps)(
  "stamp type: $credentialType -- adding and deleting stamps",
  ({ credentialType, stampsToAdd, stampsToPatch }) => {
    beforeEach(async () => {
      const TEST_SEED = Uint8Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));

      // Create and authenticate the DID
      testDID = new DID({
        provider: new Ed25519Provider(TEST_SEED),
        resolver: getResolver(),
      });
      await testDID.authenticate();

      composeDatabase = new ComposeDatabase(testDID, process.env.CERAMIC_CLIENT_URL || "http://localhost:7007");
    });

    it("stamp type: $credentialType -- should add stamps to compose-db", async () => {
      let passportResult = await composeDatabase.getPassport();
      expect(passportResult.status).toEqual("Success");
      expect(passportResult.passport?.stamps.length).toEqual(0);
      const addRequest = await composeDatabase.addStamps(stampsToAdd);
      const result = await composeDatabase.getPassport();
      expect(result.status).toEqual("Success");
      expect(result.passport?.stamps.length).toEqual(1);
      expect(result.passport?.stamps[0].provider).toEqual(stampsToAdd[0].provider);
    });

    it("stamp type: $credentialType -- should indicate an error when adding a stamp", async () => {
      const result = await composeDatabase.addStamps([badStamp]);
      expect(result.filter(({ secondaryStorageError }) => secondaryStorageError).length).toEqual(1);
    });

    it("stamp type: $credentialType -- should delete stamps from compose-db", async () => {
      // First add a stamp
      let passportResult = await composeDatabase.getPassport();
      expect(passportResult.status).toEqual("Success");
      expect(passportResult.passport?.stamps.length).toEqual(0);
      const addRequest = await composeDatabase.addStamps(stampsToAdd);

      // Check that item was added
      let passportResultAfterAdd = await composeDatabase.getPassport();
      expect(passportResultAfterAdd.status).toEqual("Success");
      expect(passportResultAfterAdd.passport?.stamps.length).toEqual(1);

      // Now delete the stamp
      await composeDatabase.deleteStamps([stampsToAdd[0].provider]);
      const result = await composeDatabase.getPassport();
      expect(result.status).toEqual("Success");
      expect(result.passport?.stamps.length).toEqual(0);
    });

    it("should indicate that one stamp failed to save while others were successful", async () => {
      let passportResult = await composeDatabase.getPassport();
      expect(passportResult.status).toEqual("Success");
      expect(passportResult.passport?.stamps.length).toEqual(0);

      const result = await composeDatabase.addStamps([badStamp, stampsToAdd[0]]);
      expect(result.filter(({ secondaryStorageError }) => secondaryStorageError).length).toEqual(1);

      let newPassport = await composeDatabase.getPassport();
      expect(newPassport.status).toEqual("Success");
      expect(newPassport.passport?.stamps.length).toEqual(1);
    });
    // Not sure how to test this one
    // it("should indicate an error when deleting a stamp", async () => {
    //   const invalidStamp = stampsToAdd[0];
    //   delete invalidStamp.credential.issuer;
    //   const result = await composeDatabase.deleteStamps([invalidStamp.provider]);
    //   expect(result.status).toEqual("ExceptionRaised");
    //   expect(result.errorDetails).toBeDefined();
    //   expect(result.errorDetails?.messages.length).toEqual(1);
    // });
  }
);

describe.skip.each(testStamps)(
  "stamp type: $credentialType -- getting a passport",
  ({ credentialType, stampsToAdd, stampsToPatch }) => {
    beforeEach(async () => {
      const TEST_SEED = Uint8Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));

      // Create and authenticate the DID
      testDID = new DID({
        provider: new Ed25519Provider(TEST_SEED),
        resolver: getResolver(),
      });
      await testDID.authenticate();

      composeDatabase = new ComposeDatabase(testDID, process.env.CERAMIC_CLIENT_URL || "http://localhost:7007");
    });

    it("stamp type: $credentialType -- should return a passport", async () => {
      const result = await composeDatabase.getPassport();
      expect(result.status).toEqual("Success");
      expect(result.passport?.stamps.length).toEqual(0);
    });

    it("stamp type: $credentialType -- should return the identical stamp data that has been put in", async () => {
      const addRequest = await composeDatabase.addStamps(stampsToAdd);
      const result = await composeDatabase.getPassport();
      expect(result.status).toEqual("Success");
      expect(result.passport?.stamps.length).toEqual(1);
      const stampData = result.passport?.stamps[0];
      expect(stampData?.provider).toEqual(stampsToAdd[0].provider);
      expect(stampData?.credential).toEqual(stampsToAdd[0].credential);
    });
  }
);

describe.each(testStamps)(
  "stamp type: $credentialType -- updating an existing passport",
  ({ credentialType, stampsToAdd, stampsToPatch }) => {
    beforeEach(async () => {
      const TEST_SEED = Uint8Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));

      // Create and authenticate the DID
      testDID = new DID({
        provider: new Ed25519Provider(TEST_SEED),
        resolver: getResolver(),
      });
      await testDID.authenticate();

      composeDatabase = new ComposeDatabase(testDID, process.env.CERAMIC_CLIENT_URL || "http://localhost:7007");
    });

    it("should update a passport's stamps within compose-db", async () => {
      // First read should return 0 passports ...
      let passportResult = await composeDatabase.getPassport();
      expect(passportResult.status).toEqual("Success");
      expect(passportResult.passport?.stamps.length).toEqual(0);

      // Patch a stamp, then read again -> we expect the stamp to be created
      await composeDatabase.patchStamps(stampsToPatch);
      passportResult = await composeDatabase.getPassport();
      expect(passportResult.status).toEqual("Success");
      expect(passportResult.passport?.stamps.length).toEqual(1);

      // Patch a stamp again, then read again. We expect the new
      const newStampPatch: StampPatch = JSON.parse(JSON.stringify(stampsToPatch[0]));
      if (newStampPatch.credential) {
        newStampPatch.credential.issuer = "Dummy Issuer";
      }
      await composeDatabase.patchStamps([newStampPatch]);
      passportResult = await composeDatabase.getPassport();
      expect(passportResult.status).toEqual("Success");
      expect(passportResult.passport?.stamps.length).toEqual(1);
      expect(passportResult.passport?.stamps[0].credential.issuer).toEqual("Dummy Issuer");
    });

    it("should indicate that an error was thrown while patching stamps", async () => {
      const result = await composeDatabase.patchStamps([badStamp]);
      expect(result.adds.filter(({ secondaryStorageError }) => secondaryStorageError).length).toEqual(1);
    });
  }
);
