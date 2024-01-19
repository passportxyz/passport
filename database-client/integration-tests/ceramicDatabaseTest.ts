import { Stamp, StampPatch } from "@gitcoin/passport-types";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { jest } from "@jest/globals";
import mockStamps from "../__tests__/mockStamps.json";

import { ComposeDatabase } from "../src";

let testDID: DID;
let composeDatabase: ComposeDatabase;

jest.setTimeout(180000);

const stampsToPatch: StampPatch[] = [mockStamps[0] as StampPatch];
const stampsToAdd: Stamp[] = [mockStamps[1] as Stamp];
const badStamp = JSON.parse(JSON.stringify(mockStamps[2])) as Stamp;
delete badStamp.credential.issuer;

beforeAll(async () => {
  const TEST_SEED = Uint8Array.from({ length: 32 }, () => Math.floor(Math.random() * 256));

  // Create and authenticate the DID
  testDID = new DID({
    provider: new Ed25519Provider(TEST_SEED),
    resolver: getResolver(),
  });
  await testDID.authenticate();

  composeDatabase = new ComposeDatabase(testDID, process.env.CERAMIC_CLIENT_URL || "http://localhost:7007");
});

describe("adding and deleting stamps", () => {
  it("should add stamps to compose-db", async () => {
    let passportResult = await composeDatabase.getPassport();
    expect(passportResult.status).toEqual("Success");
    expect(passportResult.passport.stamps.length).toEqual(0);

    const addRequest = await composeDatabase.addStamps(stampsToAdd);
    const result = await composeDatabase.getPassport();
    debugger;
    expect(result.status).toEqual("Success");
    expect(result.passport.stamps.length).toEqual(1);
    expect(result.passport.stamps[0].provider).toEqual(stampsToAdd[0].provider);
  });
  it("should indicate an error when adding a stamp", async () => {
    const result = await composeDatabase.addStamps([badStamp]);
    expect(result.status).toEqual("ExceptionRaised");
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.messages.length).toEqual(1);
  });
  it("should delete stamps from compose-db", async () => {
    let passportResult = await composeDatabase.getPassport();
    expect(passportResult.status).toEqual("Success");
    expect(passportResult.passport.stamps.length).toEqual(1);

    await composeDatabase.deleteStamps([stampsToAdd[0].provider]);
    const result = await composeDatabase.getPassport();
    expect(result.status).toEqual("Success");
    expect(result.passport.stamps.length).toEqual(0);
  });
  it("should indicate that one stamp failed to save while others were successful", async () => {
    let passportResult = await composeDatabase.getPassport();
    expect(passportResult.status).toEqual("Success");
    expect(passportResult.passport.stamps.length).toEqual(0);

    const result = await composeDatabase.addStamps([badStamp, stampsToAdd[0]]);
    expect(result.status).toEqual("ExceptionRaised");
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.messages.length).toEqual(1);

    let newPassport = await composeDatabase.getPassport();
    expect(newPassport.status).toEqual("Success");
    expect(newPassport.passport.stamps.length).toEqual(1);
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
});

describe("getting a passport", () => {
  it("should return a passport", async () => {
    const result = await composeDatabase.getPassport();
    expect(result.status).toEqual("Success");
    expect(result.passport.stamps.length).toEqual(1);
  });
  it("should return stamp data", async () => {
    const result = await composeDatabase.getPassport();
    expect(result.status).toEqual("Success");
    expect(result.passport.stamps.length).toEqual(1);
    const stampData = result.passport.stamps[0];
    expect(stampData.provider).toEqual(stampsToAdd[0].provider);
    expect(stampData.credential.issuer).toEqual(stampsToAdd[0].credential.issuer);
    expect(stampData.credential.issuanceDate).toEqual(stampsToAdd[0].credential.issuanceDate);
  });
});

describe("updating an existing passport", () => {
  it("should update a passport's stamps within compose-db", async () => {
    // First read should return 0 passports ...
    let passportResult = await composeDatabase.getPassport();

    expect(passportResult.status).toEqual("Success");
    expect(passportResult.passport.stamps.length).toEqual(0);

    // Patch a stamp, then read again -> we expect the stamp to be created
    await composeDatabase.patchStamps(stampsToPatch);
    passportResult = await composeDatabase.getPassport();
    expect(passportResult.status).toEqual("Success");
    expect(passportResult.passport.stamps.length).toEqual(1);

    // Patch a stamp again, then read again. We expect the new
    const newStampPatch: StampPatch = JSON.parse(JSON.stringify(stampsToPatch[0]));
    newStampPatch.credential.issuer = "Dummy Issuer";
    await composeDatabase.patchStamps([newStampPatch]);
    passportResult = await composeDatabase.getPassport();
    expect(passportResult.status).toEqual("Success");
    expect(passportResult.passport.stamps.length).toEqual(1);
    expect(passportResult.passport.stamps[0].credential.issuer).toEqual("Dummy Issuer");
  });
  it("should indicate that an error was thrown while patching stamps", async () => {
    const result = await composeDatabase.patchStamps([badStamp]);
    expect(result.status).toEqual("ExceptionRaised");
    expect(result.errorDetails).toBeDefined();
    expect(result.errorDetails?.messages.length).toEqual(1);
  });
});
