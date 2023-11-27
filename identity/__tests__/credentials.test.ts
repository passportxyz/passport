// ---- Test subject
import {
  issueChallengeCredential,
  issueHashedCredential,
  verifyCredential,
  fetchChallengeCredential,
  fetchVerifiableCredential,
  objToSortedArray,
} from "../src/credentials";

// ---- base64 encoding
import * as base64 from "@ethersproject/base64";

// ---- crypto lib for hashing
import { createHash } from "crypto";

// ---- Mocked values and helpers
import {
  MOCK_CHALLENGE_CREDENTIAL,
  MOCK_CHALLENGE_VALUE,
  MOCK_VERIFY_RESPONSE_BODY,
  clearAxiosMocks,
} from "../__mocks__/axios";
import * as mockDIDKit from "../__mocks__/didkit";

// ---- Types
import axios from "axios";
import { DIDKitLib, RequestPayload, VerifiableCredential, SignatureType } from "@gitcoin/passport-types";

// ---- Set up DIDKit mock
const DIDKit: DIDKitLib = mockDIDKit as unknown as DIDKitLib;

// this would need to be a valid key but we've mocked out didkit (and no verifications are made)
const key = "SAMPLE_KEY";

describe("Fetch Credentials", function () {
  const IAM_URL = "iam.example";
  const payload: RequestPayload = {
    address: "0x0",
    type: "Simple",
    version: "Test-Case-1",
  };

  const MOCK_SIGNED_PAYLOAD = {
    signatures: ["signature"],
    payload: "0x123",
    cid: ["0x456"],
    cacao: ["0x789"],
    issuer: "0x0",
  };

  const MOCK_CREATE_SIGNED_PAYLOAD = jest.fn().mockImplementation(() => Promise.resolve(MOCK_SIGNED_PAYLOAD));

  const IAM_CHALLENGE_ENDPOINT = `${IAM_URL}/v${payload.version}/challenge`;
  const expectedChallengeRequestBody = { payload: { address: payload.address, type: payload.type } };

  const IAM_VERIFY_ENDPOINT = `${IAM_URL}/v${payload.version}/verify`;
  const expectedVerifyRequestBody = {
    payload: {
      ...payload,
    },
    signedChallenge: MOCK_SIGNED_PAYLOAD,
    challenge: MOCK_CHALLENGE_CREDENTIAL,
  };

  beforeEach(() => {
    MOCK_CREATE_SIGNED_PAYLOAD.mockClear();
    clearAxiosMocks();
  });

  it("can fetch a challenge credential", async () => {
    const { challenge: actualChallenge } = await fetchChallengeCredential(IAM_URL, payload);

    // check that called the axios.post fn
    expect(axios.post).toHaveBeenCalled();
    expect(axios.post).toHaveBeenCalledWith(IAM_CHALLENGE_ENDPOINT, expectedChallengeRequestBody);
    expect(actualChallenge).toEqual(MOCK_CHALLENGE_CREDENTIAL);
  });

  it("can fetch a verifiable credential", async () => {
    const { credentials } = await fetchVerifiableCredential(IAM_URL, payload, MOCK_CREATE_SIGNED_PAYLOAD);

    // called to fetch the challenge and to verify
    expect(axios.post).toHaveBeenCalledTimes(2);
    expect(axios.post).toHaveBeenNthCalledWith(1, IAM_CHALLENGE_ENDPOINT, expectedChallengeRequestBody);
    expect(axios.post).toHaveBeenNthCalledWith(2, IAM_VERIFY_ENDPOINT, expectedVerifyRequestBody);

    expect(MOCK_CREATE_SIGNED_PAYLOAD).toHaveBeenCalled();
    expect(MOCK_CREATE_SIGNED_PAYLOAD).toHaveBeenCalledWith(MOCK_CHALLENGE_VALUE);

    expect(credentials).toEqual([MOCK_VERIFY_RESPONSE_BODY]);
  });

  it("will throw if signer rejects request for signature", async () => {
    // if the user rejects the signing then the signer will throw an error...
    MOCK_CREATE_SIGNED_PAYLOAD.mockImplementation(async () => {
      throw new Error("Unable to sign");
    });

    await expect(fetchVerifiableCredential(IAM_URL, payload, MOCK_CREATE_SIGNED_PAYLOAD)).rejects.toThrow(
      "Unable to sign"
    );
    expect(MOCK_CREATE_SIGNED_PAYLOAD).toHaveBeenCalled();
  });

  it("will not attempt to sign if not provided a challenge in the challenge credential", async () => {
    jest.spyOn(axios, "post").mockResolvedValueOnce({
      data: {
        credential: {
          credentialSubject: {
            challenge: null,
          },
        },
      },
    });

    await expect(fetchVerifiableCredential(IAM_URL, payload, MOCK_CREATE_SIGNED_PAYLOAD)).rejects.toThrow(
      "Unable to sign message"
    );

    expect(axios.post).toHaveBeenNthCalledWith(1, IAM_CHALLENGE_ENDPOINT, expectedChallengeRequestBody);
    // NOTE: the signMessage function was never called
    expect(MOCK_CREATE_SIGNED_PAYLOAD).not.toBeCalled();
  });
});

describe("Generate Credentials", function () {
  beforeEach(() => {
    mockDIDKit.clearDidkitMocks();
  });

  it("can generate a challenge credential", async () => {
    const record = {
      type: "Simple",
      address: "0x0",
      version: "Test-Case-1",
      challenge: "randomChallengeString",
    };

    // details of this credential are created by issueChallengeCredential - but the proof is added by DIDKit (which is mocked)
    const { credential } = await issueChallengeCredential(DIDKit, key, record);

    // expect to have called issueCredential
    expect(DIDKit.issueCredential).toHaveBeenCalled();
    // expect the structure/details added by issueChallengeCredential to be correct
    expect(credential.credentialSubject.id).toEqual(`did:pkh:eip155:1:${record.address}`);
    expect(credential.credentialSubject.provider).toEqual(`challenge-${record.type}`);
    expect(credential.credentialSubject.challenge).toEqual(record.challenge);
    expect(credential.credentialSubject.address).toEqual(record.address);
    expect(typeof credential.proof).toEqual("object");
  });

  const signType: SignatureType = "EIP712";
  it("can generate am EIP712 signed challenge credential", async () => {
    const record = {
      type: "Simple",
      address: "0x0",
      version: "Test-Case-1",
      challenge: "randomChallengeString",
      signatureType: signType,
    };

    // details of this credential are created by issueChallengeCredential - but the proof is added by DIDKit (which is mocked)
    const { credential } = await issueChallengeCredential(DIDKit, key, record, "EIP712");

    // expect to have called issueCredential
    expect(DIDKit.issueCredential).toHaveBeenCalled();
    // expect the structure/details added by issueChallengeCredential to be correct
    expect(credential.credentialSubject.id).toEqual(`did:pkh:eip155:1:${record.address}`);
    expect(credential.credentialSubject.provider).toEqual(`challenge-${record.type}`);
    expect(credential.credentialSubject.challenge).toEqual(record.challenge);
    expect(credential.credentialSubject.address).toEqual(record.address);
    expect(typeof credential.proof).toEqual("object");
  });

  it("can convert an object to an sorted array for deterministic hashing", async () => {
    const record = {
      type: "Simple",
      address: "0x0",
      version: "Test-Case-1",
      email: "my_own@email.com",
    };

    expect(objToSortedArray(record)).toEqual([
      ["address", "0x0"],
      ["email", "my_own@email.com"],
      ["type", "Simple"],
      ["version", "Test-Case-1"],
    ]);
  });
  it("can generate a credential containing hash", async () => {
    const record = {
      type: "Simple",
      version: "Test-Case-1",
      address: "0x0",
    };

    const expectedHash: string =
      "v0.0.0:" +
      base64.encode(
        createHash("sha256")
          .update(key)
          .update(JSON.stringify(objToSortedArray(record)))
          .digest()
      );
    // details of this credential are created by issueHashedCredential - but the proof is added by DIDKit (which is mocked)
    const { credential } = await issueHashedCredential(DIDKit, key, "0x0", record);
    // expect to have called issueCredential
    expect(DIDKit.issueCredential).toHaveBeenCalled();
    // expect the structure/details added by issueHashedCredential to be correct
    expect(credential.credentialSubject.id).toEqual(`did:pkh:eip155:1:${record.address}`);
    expect(credential.credentialSubject.provider).toEqual(`${record.type}`);
    expect(typeof credential.credentialSubject.hash).toEqual("string");
    expect(credential.credentialSubject.hash).toEqual(expectedHash);
    expect(typeof credential.proof).toEqual("object");
  });
  it("can generate an eip712 signed credential containing hash", async () => {
    const record = {
      type: "Simple",
      version: "Test-Case-1",
      address: "0x0",
    };

    const expectedHash: string =
      "v0.0.0:" +
      base64.encode(
        createHash("sha256")
          .update(key)
          .update(JSON.stringify(objToSortedArray(record)))
          .digest()
      );
    // details of this credential are created by issueHashedCredential - but the proof is added by DIDKit (which is mocked)
    const { credential } = await issueHashedCredential(DIDKit, key, "0x0", record, 100, "EIP712");
    // expect to have called issueCredential
    expect(DIDKit.issueCredential).toHaveBeenCalled();
    // expect the structure/details added by issueHashedCredential to be correct
    expect(credential.credentialSubject.id).toEqual(`did:pkh:eip155:1:${record.address}`);
    expect(credential.credentialSubject.provider).toEqual(`${record.type}`);
    expect(typeof credential.credentialSubject.hash).toEqual("string");
    expect(credential.credentialSubject.hash).toEqual(expectedHash);
    expect(typeof credential.proof).toEqual("object");
    expect(credential["@context"]).toContain("https://w3id.org/vc/status-list/2021/v1");
    expect(credential["@context"]).toContain("https://w3id.org/vc/status-list/2021/v1");
  });
});

describe("Verify Credentials", function () {
  beforeEach(() => {
    mockDIDKit.clearDidkitMocks();
  });

  it("can verify a credential", async () => {
    const record = {
      type: "Simple",
      version: "Test-Case-1",
      address: "0x0",
    };

    // we are creating this VC so that we know that we have a valid VC in this context to test against (never expired)
    const { credential: credentialToVerify } = await issueHashedCredential(DIDKit, key, "0x0", record);

    // all verifications will pass as the DIDKit response is mocked
    expect(await verifyCredential(DIDKit, credentialToVerify)).toEqual(true);
    // expect to have called verifyCredential
    expect(DIDKit.verifyCredential).toHaveBeenCalled();
    expect(DIDKit.verifyCredential).toHaveBeenCalledWith(JSON.stringify(credentialToVerify), expect.anything());
  });

  it("cannot verify a valid but expired credential", async () => {
    // create a date and move it into the past
    const expired = new Date();
    expired.setSeconds(expired.getSeconds() - 1);

    // if the expiration date is in the past then this VC has expired
    const credential = {
      expirationDate: expired.toISOString(),
    } as unknown as VerifiableCredential;

    // before the credential is verified against DIDKit - we check its expiration date...
    expect(await verifyCredential(DIDKit, credential)).toEqual(false);
    // expect to have not called verify on didkit
    expect(DIDKit.verifyCredential).not.toBeCalled();
  });

  it("returns false when DIDKit.verifyCredential returns with errors", async () => {
    const futureExpirationDate = new Date();
    futureExpirationDate.setFullYear(futureExpirationDate.getFullYear() + 1);
    const credentialToVerify = {
      expirationDate: futureExpirationDate.toISOString(),
      proof: {
        proofPurpose: "myProof",
      },
    } as VerifiableCredential;

    // DIDKit.verifyCredential can return with a non-empty errors array
    mockDIDKit.verifyCredential.mockResolvedValue(
      JSON.stringify({ checks: ["proof"], warnings: [], errors: ["signature error"] })
    );

    expect(await verifyCredential(DIDKit, credentialToVerify)).toEqual(false);
    expect(DIDKit.verifyCredential).toHaveBeenCalled();
  });

  it("returns false when DIDKit.verifyCredential rejects with an exception", async () => {
    const futureExpirationDate = new Date();
    futureExpirationDate.setFullYear(futureExpirationDate.getFullYear() + 1);
    const credentialToVerify = {
      expirationDate: futureExpirationDate.toISOString(),
      proof: {
        proofPurpose: "myProof",
      },
    } as VerifiableCredential;

    mockDIDKit.verifyCredential.mockRejectedValue(new Error("something went wrong :("));

    expect(await verifyCredential(DIDKit, credentialToVerify)).toEqual(false);
    expect(DIDKit.verifyCredential).toHaveBeenCalled();
  });
});
