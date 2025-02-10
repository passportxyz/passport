import { jest, it, describe, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("../src/utils/revocations.js", () => ({
  filterRevokedCredentials: jest.fn().mockImplementation((input) => Promise.resolve(input)),
}));

jest.unstable_mockModule("../src/utils/easStampSchema.js", () => ({
  formatMultiAttestationRequest: jest.fn(),
  encodeEasScore: jest.fn(() => {
    return "0xEncodedData";
  }),
}));

jest.unstable_mockModule("../src/utils/identityHelper.js", async () => {
  const originalIdentity = await import("@gitcoin/passport-identity");
  return {
    ...originalIdentity,
    verifyCredential: jest.fn(async () => Promise.resolve(true)),
    hasValidIssuer: jest.fn(() => true),
    verifyChallengeAndGetAddress: jest.fn(),
    verifyProvidersAndIssueCredentials: jest.fn(),
  };
});

import request from "supertest";
import * as DIDKit from "@spruceid/didkit-wasm-node";

const { app } = await import("../src/index.js");

import {
  ErrorResponseBody,
  RequestPayload,
  ValidResponseBody,
  VerifiableCredential,
  CredentialResponseBody,
} from "@gitcoin/passport-types";

const identityMock = await import("../src/utils/identityHelper.js");


const issuer = identityMock.getEip712Issuer();
const verifyCredential = identityMock.verifyCredential;
const hasValidIssuer = identityMock.hasValidIssuer;
const verifyChallengeAndGetAddress = identityMock.verifyChallengeAndGetAddress;
const VerifyDidChallengeBaseError = identityMock.VerifyDidChallengeBaseError;
const verifyProvidersAndIssueCredentialsMock = identityMock.verifyProvidersAndIssueCredentials as jest.Mock;


const getMockEIP712Credential = (provider: string, address: string): VerifiableCredential => {
  return {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    type: ["VerifiableCredential", "Stamp"],
    issuer: "BAD_ISSUER",
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      "@context": {},
      id: `did:pkh:eip155:1:${address}`,
      provider: provider,
      hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
    },
    expirationDate: "9999-12-31T23:59:59Z",
    proof: {
      "@context": "proof",
      type: "type",
      proofPurpose: "proofPurpose",
      proofValue: "proofValue",
      verificationMethod: "verificationMethod",
      created: "created",
      eip712Domain: {
        domain: {
          name: "name",
        },
        primaryType: "primaryType",
        types: {},
      },
    },
  };
};

describe("POST /verify", function () {
  beforeEach(() => {
    verifyProvidersAndIssueCredentialsMock.mockImplementation(
      async (
        providersByPlatform: string[][],
        address: string,
        payload: RequestPayload
      ): Promise<CredentialResponseBody[]> => {
        const ret: CredentialResponseBody[] = [];
        providersByPlatform.forEach((providers) => {
          providers.forEach((provider) => {
            const _provider = provider === "ClearTextSimple" ? "ClearTextSimple#Username" : provider;
            ret.push({
              credential: getMockEIP712Credential(_provider, address),
              record: {
                type: "test-record",
                version: "v0.0.0",
                pii: provider === "ClearTextSimple" ? _provider : undefined,
              },
            });
          });
        });
        return ret;
      }
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
  });

  it("handles valid wallet-signed challenge requests", async () => {
    // Mock the did-session method to throw an error, to ensure we're not calling it
    (verifyChallengeAndGetAddress as jest.Mock).mockImplementationOnce(() => {
      return "0x123456";
    });

    (hasValidIssuer as jest.Mock).mockImplementationOnce(() => {
      return true;
    });

    (verifyCredential as jest.Mock).mockImplementationOnce(async () => {
      return Promise.resolve(true);
    });

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x123456",
        provider: "challenge-Simple",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      types: ["Simple"],
      address: "0x123456",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x123456";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // check for an id match on the mocked credential
    const credential = (response.body as ValidResponseBody[])[0];
    expect(credential.credential.credentialSubject.id).toEqual(expectedId);

    // Check that only the expected keys are returned
    const returnedConstKeys = Object.keys(credential);
    expect(returnedConstKeys.sort()).toEqual(["record", "credential"].sort());
    expect(verifyChallengeAndGetAddress as jest.Mock).toHaveBeenCalledTimes(1);
    expect(verifyChallengeAndGetAddress as jest.Mock).toHaveBeenCalledWith({
      challenge,
      payload,
    });
  });

  it("handles valid did-session signed challenge requests", async () => {
    (verifyChallengeAndGetAddress as jest.Mock).mockImplementationOnce(() => {
      return "0x123456";
    });

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x123456",
        provider: "challenge-Simple",
        address: "0x123456",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      types: ["Simple"],
      address: "0x123456",
      proofs: {
        valid: "true",
        username: "test",
      },
    };

    const signedChallenge = {
      signatures: [
        {
          protected: "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ",
          signature: "0x0",
        },
      ],
      payload: "I commit that this wallet is under my control",
      cid: [0, 1, 2],
      cacao: [3, 4, 5],
      issuer: "0x123456",
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x123456";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload, signedChallenge })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // check for an id match on the mocked credential
    const credential = (response.body as ValidResponseBody[])[0];
    expect(credential.credential.credentialSubject.id).toEqual(expectedId);
    // Check that only the expected keys are returned
    const returnedConstKeys = Object.keys(credential);
    expect(returnedConstKeys.sort()).toEqual(["record", "credential"].sort());
    expect(verifyChallengeAndGetAddress as jest.Mock).toHaveBeenCalledTimes(1);
    expect(verifyChallengeAndGetAddress as jest.Mock).toHaveBeenCalledWith({
      challenge,
      payload,
      signedChallenge,
    });
  });

  it("handles invalid did-session signed challenge requests", async () => {
    (verifyChallengeAndGetAddress as jest.Mock).mockImplementationOnce(() => {
      throw new VerifyDidChallengeBaseError("Verification failed, challenge mismatch");
    });

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-Simple",
        address: "0x123456",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
      },
    };

    const signedChallenge = {
      signatures: [
        {
          protected: "eyJhbGciOiJFUzI1NksiLCJ0eXAiOiJKV1QifQ",
          signature: "0x0",
        },
      ],
      payload: "I commit that this wallet is under my control",
      cid: [0, 1, 2],
      cacao: [3, 4, 5],
      issuer: "0x123456",
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload, signedChallenge })
      .set("Accept", "application/json")
      .expect(401)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Invalid challenge signature: Error");
  });

  it("handles valid verify requests with EIP712 signature", async () => {
    (verifyChallengeAndGetAddress as jest.Mock).mockImplementationOnce(() => {
      return "0x0";
    });

    (hasValidIssuer as jest.Mock).mockImplementationOnce(() => {
      return true;
    });

    (verifyCredential as jest.Mock).mockImplementationOnce(async () => {
      return Promise.resolve(true);
    });

    // challenge received from the challenge endpoint
    const eip712Key = process.env.IAM_JWK_EIP712;
    const eip712Issuer = DIDKit.keyToDID("ethr", eip712Key);
    const challenge = {
      issuer: eip712Issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-Simple",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      types: ["Simple"],
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
      signatureType: "EIP712",
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // check for an id match on the mocked credential
    const credential = (response.body as ValidResponseBody[])[0];
    expect(credential.credential.credentialSubject.id).toEqual(expectedId);
    // Check that only the expected keys are returned
    const returnedConstKeys = Object.keys(credential);
    expect(returnedConstKeys.sort()).toEqual(["record", "credential"].sort());
  });

  it("handles valid verify requests with 'EIP712' or 'Ed25519'  signature", async () => {
    (verifyChallengeAndGetAddress as jest.Mock).mockImplementationOnce(() => {
      return "0x0";
    });

    (hasValidIssuer as jest.Mock).mockImplementationOnce(() => {
      return true;
    });

    (verifyCredential as jest.Mock).mockImplementationOnce(async () => {
      return Promise.resolve(true);
    });
    // challenge received from the challenge endpoint
    const eip712Key = process.env.IAM_JWK_EIP712;
    const eip712Issuer = DIDKit.keyToDID("ethr", eip712Key);
    const challenge = {
      issuer: eip712Issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-Simple",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      types: ["Simple"],
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
      signatureType: "EIP712",
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    const verifyProvidersAndIssueCredentialsFn = jest.spyOn(identityMock, "verifyProvidersAndIssueCredentials");

    // create a req against the express app
    // test the call with "EIP712" signature first, an verify that this is correctly forwarded
    await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(verifyProvidersAndIssueCredentialsFn).toHaveBeenCalledWith([["Simple"]], "0x0", payload);

    // test the call with "EIP712" signature first, an verify that this is correctly forwarded
    verifyProvidersAndIssueCredentialsFn.mockClear();

    (verifyChallengeAndGetAddress as jest.Mock).mockImplementationOnce(() => {
      return "0x0";
    });

    (hasValidIssuer as jest.Mock).mockImplementationOnce(() => {
      return true;
    });

    (verifyCredential as jest.Mock).mockImplementationOnce(async () => {
      return Promise.resolve(true);
    });

    payload.signatureType = "Ed25519";
    await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(verifyProvidersAndIssueCredentialsFn).toHaveBeenCalledWith([["Simple"]], "0x0", payload);
  });

  it("returns the pii record on requests", async () => {
    const provider = "ClearTextSimple";

    (verifyChallengeAndGetAddress as jest.Mock).mockImplementationOnce(() => {
      return "0x0";
    });

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: `challenge-${provider}`,
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: provider,
      types: [provider],
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    const expectedProvider = `${provider}#Username`;

    // check that PII is returned with provider
    expect((response.body as ValidResponseBody[])[0].credential.credentialSubject.provider).toEqual(expectedProvider);
    // check for an id match on the mocked credential
    expect((response.body as ValidResponseBody[])[0].credential.credentialSubject.id).toEqual(expectedId);
    // check the returned record
    expect((response.body as ValidResponseBody[])[0].record).toEqual({
      pii: expectedProvider,
      type: "test-record",
      version: "v0.0.0",
    });
  });

  it("handles valid challenge requests with multiple types", async () => {
    (verifyChallengeAndGetAddress as jest.Mock).mockImplementationOnce(() => {
      return "0x0";
    });

    (hasValidIssuer as jest.Mock).mockImplementationOnce(() => {
      return true;
    });

    (verifyCredential as jest.Mock).mockImplementationOnce(async () => {
      return Promise.resolve(true);
    });

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-any",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "any",
      types: ["Simple-1", "Simple-2"],
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = "did:pkh:eip155:1:0x0";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // check for an id match on the mocked credential
    expect((response.body[0] as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);
    expect((response.body[0] as ValidResponseBody).credential.credentialSubject.provider).toEqual("Simple-1");
    expect((response.body[1] as ValidResponseBody).credential.credentialSubject.id).toEqual(expectedId);
    expect((response.body[1] as ValidResponseBody).credential.credentialSubject.provider).toEqual("Simple-2");
  });

  it("handles invalid challenge requests where credential.issuer is unknown", async () => {
    (hasValidIssuer as jest.Mock).mockImplementationOnce(() => {
      return false;
    });

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: "unknown",
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-Simple",
        address: "0x0",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(401)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Unable to verify payload");
  });

  it("handles invalid challenge requests where challenge credential subject signature checks fail", async () => {
    (hasValidIssuer as jest.Mock).mockImplementationOnce(() => {
      return true;
    });

    (verifyCredential as jest.Mock).mockImplementationOnce(async () => {
      return Promise.resolve(true);
    });

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0xNotAnEthereumAddress#challenge-Simple",
        address: "0xNotAnEthereumAddress",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "false",
        username: "test",
        signature: "pass",
      },
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(401)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Invalid challenge 'signer' and 'provider'");
  });

  it("handles exception if verify challenge credential throws", async () => {
    (identityMock.verifyCredential as jest.Mock).mockRejectedValueOnce(new Error("Verify Credential Error"));

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0xNotAnEthereumAddress",
        type: "challenge-Simple",
        address: "0xNotAnEthereumAddress",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "false",
        username: "test",
        signature: "pass",
      },
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(500)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Unable to verify payload: Error");
  });

  it("handles exception if verify challenge credential returns false", async () => {
    (identityMock.verifyCredential as jest.Mock).mockResolvedValueOnce(false);

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0xNotAnEthereumAddress",
        type: "challenge-Simple",
        address: "0xNotAnEthereumAddress",
        challenge: "123456789ABDEFGHIJKLMNOPQRSTUVWXYZ",
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "false",
        username: "test",
        signature: "pass",
      },
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(401)
      .expect("Content-Type", /json/);

    expect((response.body as ErrorResponseBody).error).toEqual("Unable to verify payload");
  });

  it("handles invalid challenge request passed by the additional signer", async () => {
    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-any",
        address: "0x0",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };
    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "any",
      types: ["Simple", "Simple"],
      address: "0x0",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
      signer: {
        address: "0x0",
        challenge: {
          credentialSubject: {
            challenge: "I commit that this wallet is under my control",
          },
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };

    // resolve the verification
    jest.spyOn(identityMock, "verifyCredential").mockResolvedValue(true).mockResolvedValue(false);

    // create a req against the express app
    await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(401)
      .expect("Content-Type", /json/);
  });

  it("handles valid challenge request passed by the additional signer", async () => {
    (verifyChallengeAndGetAddress as jest.Mock).mockImplementationOnce(() => {
      return "0x0";
    });

    // challenge received from the challenge endpoint
    const challenge = {
      issuer: issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0",
        provider: "challenge-any",
        address: "0x0",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payload = {
      type: "any",
      types: ["Simple", "Simple"],
      address: "0x1",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
      signer: {
        address: "0x0",
        signature: "0x1",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
          credentialSubject: {
            challenge: "I commit that this wallet is under my control",
          },
        },
      },
    };

    // resolve the verification
    jest.spyOn(identityMock, "verifyCredential").mockResolvedValue(true);

    // create a req against the express app
    await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge, payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);
  });
});
