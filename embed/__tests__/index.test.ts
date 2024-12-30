// ---- Testing libraries

// jest.mock("ioredis");

import request from "supertest";
import { Response, Request } from "express";
import { apiKeyRateLimit, keyGenerator } from "../src/rate-limiter";
import {
  PassportScore,
  AutoVerificationResponseBodyType,
  AutoVerificationRequestBodyType,
} from "../src/autoVerification";
import { ParamsDictionary } from "express-serve-static-core";
import { VerifiableEip712Credential } from "@gitcoin/passport-types";
// ---- Test subject

const mockedScore: PassportScore = {
  address: "0x0000000000000000000000000000000000000000",
  score: "12",
  passing_score: true,
  last_score_timestamp: new Date().toISOString(),
  expiration_timestamp: new Date().toISOString(),
  threshold: "20.000",
  error: "",
  stamps: { "provider-1": { score: "12", dedup: true, expiration_date: new Date().toISOString() } },
};

// const createMockVerifiableCredential = (address: string): VerifiableEip712Credential => ({
//   "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/security/suites/eip712sig-2021/v1"],
//   type: ["VerifiableCredential", "EVMCredential"],
//   credentialSubject: {
//     id: `did:pkh:eip155:1:${address}`,
//     "@context": {
//       hash: "https://schema.org/Text",
//       provider: "https://schema.org/Text",
//       address: "https://schema.org/Text",
//       challenge: "https://schema.org/Text",
//       metaPointer: "https://schema.org/URL",
//     },
//     hash: "0x123456789",
//     provider: "test-provider",
//     address: address,
//     challenge: "test-challenge",
//     metaPointer: "https://example.com/metadata",
//   },
//   issuer: "did:key:test-issuer",
//   issuanceDate: new Date().toISOString(),
//   expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
//   proof: {
//     "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
//     type: "EthereumEip712Signature2021",
//     proofPurpose: "assertionMethod",
//     proofValue: "0xabcdef1234567890",
//     verificationMethod: "did:key:test-verification",
//     created: new Date().toISOString(),
//     eip712Domain: {
//       domain: {
//         name: "GitcoinVerifiableCredential",
//       },
//       primaryType: "VerifiableCredential",
//       types: {
//         EIP712Domain: [
//           { name: "name", type: "string" },
//           { name: "version", type: "string" },
//         ],
//         VerifiableCredential: [
//           { name: "id", type: "string" },
//           { name: "address", type: "string" },
//         ],
//       },
//     },
//   },
// });

jest.mock("../src/rate-limiter", () => {
  const originalModule = jest.requireActual<typeof import("../src/rate-limiter")>("../src/rate-limiter");

  return {
    ...originalModule,
    apiKeyRateLimit: jest.fn((req, res) => {
      return new Promise((resolve, reject) => {
        resolve(10000);
      });
    }),
    keyGenerator: jest.fn(originalModule.keyGenerator),
  };
});

jest.mock("../src/autoVerification", () => {
  const originalModule = jest.requireActual<typeof import("../src/autoVerification")>("../src/autoVerification");

  return {
    // __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    autoVerificationHandler: jest.fn(
      (
        req: Request<ParamsDictionary, AutoVerificationResponseBodyType, AutoVerificationRequestBodyType>,
        res: Response
      ): Promise<void> => {
        return new Promise((resolve, reject) => {
          res.status(200).json(mockedScore);
          resolve();
        });
      }
    ),
  };
});

import { app } from "../src/index";

beforeEach(() => {
  // CLear the spy stats
  jest.clearAllMocks();
});

describe("POST /embed/verify", function () {
  it("handles valid verify requests", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      address: "0x0000000000000000000000000000000000000000",
      scorerId: "123",
    };

    // create a req against the express app
    const verifyRequest = await request(app)
      .post("/embed/verify")
      .send(payload)
      .set("Accept", "application/json")
      .set("X-API-KEY", "MY.SECRET-KEY");

    expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(1);
    expect(keyGenerator as jest.Mock).toHaveBeenCalledTimes(1);
    expect(verifyRequest.status).toBe(200);
    expect(verifyRequest.body).toStrictEqual(mockedScore);
  });

  it("handles invalid verify requests - missing api key", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      address: "0x0000000000000000000000000000000000000000",
      scorerId: "123",
    };

    // create a req against the express app
    const verifyRequest = await request(app).post("/embed/verify").send(payload).set("Accept", "application/json");

    expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(0);
    expect(keyGenerator as jest.Mock).toHaveBeenCalledTimes(1);
    expect(verifyRequest.status).toBe(401);
    expect(verifyRequest.body).toStrictEqual({ message: "Unauthorized! No 'X-API-KEY' present in the header!" });
  });

  it("handles invalid verify requests - api key validation fails", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      address: "0x0000000000000000000000000000000000000000",
      scorerId: "123",
    };

    (apiKeyRateLimit as jest.Mock).mockImplementationOnce(() => {
      throw "Invalid API-KEY";
    });

    // create a req against the express app
    const verifyRequest = await request(app)
      .post("/embed/verify")
      .send(payload)
      .set("Accept", "application/json")
      .set("X-API-KEY", "MY.SECRET-KEY");

    expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(1);
    expect(keyGenerator as jest.Mock).toHaveBeenCalledTimes(1);
    expect(verifyRequest.status).toBe(500);
  });
});

describe("POST /health", function () {
  it("handles valid health requests", async () => {
    // create a req against the express app
    const verifyRequest = await request(app).get("/health").set("Accept", "application/json");

    expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(0);
    expect(keyGenerator as jest.Mock).toHaveBeenCalledTimes(0);
    expect(verifyRequest.status).toBe(200);
    expect(verifyRequest.body).toStrictEqual({
      message: "Ok",
    });
  });
});
