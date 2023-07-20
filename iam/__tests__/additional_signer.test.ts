// ---- Testing libraries
import request from "supertest";
import * as DIDKit from "@spruceid/didkit-wasm-node";

// --- Mocks - test configuration

process.env.IAM_JWK = DIDKit.generateEd25519Key();

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
    // challenge received from the challenge endpoint
    // const challenge = {
    //   issuer: config.issuer,
    //   credentialSubject: {
    //     id: "did:pkh:eip155:1:0x0",
    //     provider: "challenge-any",
    //     address: "0xb80fe00553a6c906b30d0134eb6fc8219b68727f",
    //     challenge: {
    //       issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
    //     },
    //   },
    // };

    // // payload containing a signature of the challenge in the challenge credential
    // const payloadWithAdditionalSigner = {
    //   type: "any",
    //   types: ["Simple"],
    //   address: "0x5a465eba7d3a561e7fef74d3fa1043e7378b3683",
    //   proofs: {
    //     valid: "true",
    //     username: "test",
    //     signature: "pass",
    //   },
    //   signer: {
    //     address: "0xb80fe00553a6c906b30d0134eb6fc8219b68727f",
    //     signature: "0x1",
    //     challenge: {
    //       issuer: "did:key:z6Mkecq4nKTCniqNed5cdDSURj1JX4SEdNhvhitZ48HcJMnN",
    //       credentialSubject: {
    //         challenge: "I commit that this wallet is under my control",
    //       },
    //     },
    //   },
    // };

    // const payloadWithoutAdditionalSigner = {
    //   type: "any",
    //   types: ["Simple"],
    //   address: "0xb80fe00553a6c906b30d0134eb6fc8219b68727f",
    //   proofs: {
    //     valid: "true",
    //     username: "test",
    //     signature: "pass",
    //   },
    // };

    // // resolve the verification
    // jest.spyOn(identityMock, "verifyCredential").mockResolvedValue(true);

    // // create a req against the express app
    // await request(app)
    //   .post("/api/v0.0.0/verify")
    //   .send({ challenge, payload: payloadWithAdditionalSigner })
    //   .set("Accept", "application/json")
    //   .expect(200)
    //   .expect("Content-Type", /json/);

    // await request(app)
    //   .post("/api/v0.0.0/verify")
    //   .send({ challenge, payload: payloadWithoutAdditionalSigner })
    //   .set("Accept", "application/json")
    //   .expect(200)
    //   .expect("Content-Type", /json/);
    // challenge received from the challenge endpoint

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
