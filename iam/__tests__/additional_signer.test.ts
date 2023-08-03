// ---- Testing libraries
import request from "supertest";
import * as DIDKit from "@spruceid/didkit-wasm-node";

// --- Mocks - test configuration

process.env.IAM_JWK = DIDKit.generateEd25519Key();
process.env.ATTESTATION_SIGNER_PRIVATE_KEY = "0x04d16281ff3bf268b29cdd684183f72542757d24ae9fdfb863e7c755e599163a";
process.env.GITCOIN_VERIFIER_CHAIN_ID = "84531";
process.env.ALLO_SCORER_ID = "1";
process.env.SCORER_ENDPOINT = "http://127.0.0.1:8002";
process.env.SCORER_API_KEY = "abcd";
process.env.EAS_GITCOIN_STAMP_SCHEMA = "0x";

// ---- Test subject
import { app, config } from "../src/index";

import * as identityMock from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

jest.mock("ethers", () => {
  const originalModule = jest.requireActual("ethers");
  const ethers = originalModule.ethers;
  const utils = originalModule.utils;

  return {
    utils: {
      ...utils,
      getAddress: jest
        .fn()
        .mockImplementationOnce(() => {
          return "0x1";
        })
        .mockImplementationOnce(() => {
          return "0xAbC";
        })
        .mockImplementationOnce(() => {
          return "0xAbC";
        }),
      verifyMessage: jest.fn().mockImplementation(() => {
        return "string";
      }),
      splitSignature: jest.fn().mockImplementation(() => {
        return { v: 0, r: "r", s: "s" };
      }),
    },
    ethers,
  };
});

describe("POST /verify", function () {
  it("produces the same hash for an additional signer as if the passport is used directly", async () => {
    const challengeForReqWithAdditionalSigner = {
      issuer: config.issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0x1",
        provider: "challenge-any",
        address: "0x1",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payloadWithAdditionalSigner = {
      type: "any",
      types: ["SimpleEvm"],
      address: "0x1",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
      signer: {
        address: "0xabc",
        signature: "0x123456",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
          credentialSubject: {
            challenge: "I commit that this wallet is under my control",
          },
        },
      },
    };

    const challengeForReqWithoutAdditionalSigner = {
      issuer: config.issuer,
      credentialSubject: {
        id: "did:pkh:eip155:1:0xAbC",
        provider: "challenge-any",
        address: "0xabc",
        challenge: {
          issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
        },
      },
    };

    // payload containing a signature of the challenge in the challenge credential
    const payloadWithoutAdditionalSigner = {
      type: "any",
      types: ["SimpleEvm"],
      address: "0xabc",
      proofs: {
        valid: "true",
        username: "test",
        signature: "pass",
      },
    };

    // resolve the verification
    jest.spyOn(identityMock, "verifyCredential").mockResolvedValue(true);

    const res = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge: challengeForReqWithAdditionalSigner, payload: payloadWithAdditionalSigner })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    const hashWithAdditionalSigner = res.body[0].credential.credentialSubject.hash;

    const res2 = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ challenge: challengeForReqWithoutAdditionalSigner, payload: payloadWithoutAdditionalSigner })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    const hashWithoutAdditionalSigner = res2.body[0].credential.credentialSubject.hash;

    expect(hashWithAdditionalSigner).toEqual(hashWithoutAdditionalSigner);
  });
});
