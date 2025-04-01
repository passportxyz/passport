import { RequestPayload } from "@gitcoin/passport-types";
import { getChallengeRecord } from "../src/challenge.js";

describe("getChallengeRecord", () => {
  it("returns a challenge for EVMBulkVerify", () => {
    const requestPayload = {
      type: "EVMBulkVerify",
      address: "0x1234567890123456789012345678901234567890",
    } as RequestPayload;

    const challengeRecord = getChallengeRecord(requestPayload);

    expect(challengeRecord?.address).toEqual(requestPayload.address);
    expect(challengeRecord?.type).toEqual(requestPayload.type);
    expect(challengeRecord?.challenge).toMatch(/^I commit that I wish to verify all the selected EVM stamps/);
  });

  it("returns a challenge for custom provider", () => {
    const requestPayload = {
      type: "CustomProvider",
      address: "0x1234567890123456789012345678901234567890",
    } as RequestPayload;

    const challengeRecord = getChallengeRecord(requestPayload);

    expect(challengeRecord?.address).toEqual(requestPayload.address);
    expect(challengeRecord?.type).toEqual(requestPayload.type);
    expect(challengeRecord?.challenge).toMatch(/^I commit that this stamp is my unique and only CustomProvider/);
  });
});
