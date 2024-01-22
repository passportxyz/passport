import { Stamp } from "@gitcoin/passport-types";

import * as DIDKit from "@spruceid/didkit-wasm-node";
import { issueEip712Credential, stampCredentialDocument } from "@gitcoin/passport-identity";

import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { jest } from "@jest/globals";

import { ComposeDatabase } from "../src";

let testDID: DID;
let composeDatabase: ComposeDatabase;

jest.setTimeout(180000);

const IAM_JWK_EIP712 =
  '{"kty":"EC","crv":"secp256k1","x":"PdB2nS-knyAxc6KPuxBr65vRpW-duAXwpeXlwGJ03eU","y":"MwoGZ08hF5uv-_UEC9BKsYdJVSbJNHcFhR1BZWer5RQ","d":"z9VrSNNZXf9ywUx3v_8cLDhSw8-pvAT9qu_WZmqqfWM"}';
const eip712Key = IAM_JWK_EIP712;

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

// TODO: geri add this back
// describe("assuming a valid stamp is stored in ceramic", () => {
//   it("should return a valid stamp that can be validated successfully", async () => {
//     // Step 1: First, we need to create a valid stamp
//     const verificationMethod: string = (await DIDKit.keyToVerificationMethod("ethr", eip712Key)) as string;

//     const credential = await issueEip712Credential(
//       DIDKit,
//       eip712Key,
//       { expiresAt: new Date("2050-12-31") },
//       {
//         credentialSubject: {
//           "@context": {
//             hash: "https://schema.org/Text",
//             provider: "https://schema.org/Text",
//           },
//           id: "did:3:0x123",
//           hash: "0x123",
//           provider: "Discord",
//         },
//       },
//       stampCredentialDocument(verificationMethod),
//       ["https://w3id.org/vc/status-list/2021/v1"]
//     );

//     const stampsToAdd: Stamp[] = [
//       {
//         credential,
//         provider: "Discord",
//       },
//     ];

//     // Step 2: Write the stamp to compose
//     const addRequest = await composeDatabase.addStamps(stampsToAdd);
//     expect(addRequest.status).toEqual("Success");

//     // Step 3: Read the user passport
//     const result = await composeDatabase.getPassport();

//     expect(result.status).toEqual("Success");
//     expect(result.passport.stamps.length).toEqual(1);
//     expect(result.passport.stamps[0].provider).toEqual(stampsToAdd[0].provider);

//     const readCredential = result.passport.stamps[0].credential;
//     expect(readCredential).toEqual(credential);

//     // Step 4: Validate the stamp
//     const verificationResult = JSON.parse(
//       await DIDKit.verifyCredential(JSON.stringify(readCredential), '{"proofPurpose":"assertionMethod"}')
//     );

//     expect(verificationResult).toEqual({ checks: ["proof"], warnings: [], errors: [] });
//   });
// });
