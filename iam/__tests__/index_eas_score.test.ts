// ---- Testing libraries
import request from "supertest";
import * as DIDKit from "@spruceid/didkit-wasm-node";
import { PassportCache } from "@gitcoin/passport-platforms";

// --- Mocks - test configuration

process.env.IAM_JWK = DIDKit.generateEd25519Key();
process.env.IAM_JWK_EIP712 =
  '{"kty":"EC","crv":"secp256k1","x":"PdB2nS-knyAxc6KPuxBr65vRpW-duAXwpeXlwGJ03eU","y":"MwoGZ08hF5uv-_UEC9BKsYdJVSbJNHcFhR1BZWer5RQ","d":"z9VrSNNZXf9ywUx3v_8cLDhSw8-pvAT9qu_WZmqqfWM"}';
process.env.ATTESTATION_SIGNER_PRIVATE_KEY = "0x04d16281ff3bf268b29cdd684183f72542757d24ae9fdfb863e7c755e599163a";
process.env.ALLO_SCORER_ID = "1";
process.env.SCORER_ENDPOINT = "http://127.0.0.1:8002";
process.env.SCORER_API_KEY = "abcd";
process.env.MORALIS_API_KEY = "abcd";
process.env.EAS_GITCOIN_STAMP_SCHEMA = "0x";

// ---- Test subject
import { app } from "../src/index";

import { MultiAttestationRequest, ZERO_BYTES32, NO_EXPIRATION } from "@ethereum-attestation-service/eas-sdk";

import * as identityMock from "@gitcoin/passport-identity/dist/commonjs/src/credentials";
import * as easSchemaMock from "../src/utils/easStampSchema";
import * as easPassportSchemaMock from "../src/utils/easPassportSchema";
import { IAMError } from "../src/utils/scorerService";

jest.mock("ethers", () => {
  const originalModule = jest.requireActual("ethers");
  const ethers = originalModule.ethers;
  const utils = originalModule.utils;

  return {
    utils: {
      ...utils,
      getAddress: jest.fn().mockImplementation(() => {
        return "0x0";
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

jest.mock("@ethereum-attestation-service/eas-sdk", () => {
  return {
    SchemaEncoder: jest.fn().mockImplementation(() => {
      return {
        encodeData: jest.fn().mockImplementation(() => {
          return "0x1234";
        }),
      };
    }),
    ZERO_BYTES32: "0x0000000000000000000000000000000000000000000000000000000000000000",
    NO_EXPIRATION: 0,
  };
});

jest.mock("moralis", () => ({
  EvmApi: {
    token: {
      getTokenPrice: jest.fn().mockResolvedValue({
        result: { usdPrice: 3000 },
      }),
    },
  },
}));

const chainIdHex = "0xa";

const mockMultiAttestationRequestWithScore: MultiAttestationRequest[] = [
  {
    schema: "0x853a55f39e2d1bf1e6731ae7148976fbbb0c188a898a233dba61a233d8c0e4a4",
    data: [
      {
        recipient: "0x0987654321098765432109876543210987654321",
        data: easSchemaMock.encodeEasScore({
          score: 23.45,
          scorer_id: 123,
        }),
        expirationTime: NO_EXPIRATION,
        revocable: false,
        refUID: ZERO_BYTES32,
        value: "25000000000000000",
      },
    ],
  },
];

describe("POST /eas/score", () => {
  let verifyCredentialSpy: jest.SpyInstance;
  let formatMultiAttestationRequestSpy: jest.SpyInstance;

  beforeEach(() => {
    verifyCredentialSpy = jest.spyOn(identityMock, "verifyCredential").mockResolvedValue(true);
    formatMultiAttestationRequestSpy = jest
      .spyOn(easPassportSchemaMock, "formatMultiAttestationRequestWithScore")
      .mockResolvedValue(mockMultiAttestationRequestWithScore);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("handles invalid recipient in the request body", async () => {
    const nonce = 0;
    const recipient = "0x5678";

    const response = await request(app)
      .post("/api/v0.0.0/eas/score")
      .send({ recipient, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Invalid recipient");
  });

  it("successfully verifies and formats score", async () => {
    jest.spyOn(PassportCache.prototype, "init").mockImplementation(() => Promise.resolve());
    jest.spyOn(PassportCache.prototype, "set").mockImplementation(() => Promise.resolve());
    jest.spyOn(PassportCache.prototype, "get").mockImplementation((key) => {
      if (key === "ethPrice") {
        return Promise.resolve("3000");
      } else if (key === "ethPriceLastUpdate") {
        return Promise.resolve((Date.now() - 1000 * 60 * 6).toString());
      }
    });
    const nonce = 0;
    const recipient = "0x5678000000000000000000000000000000000000";

    const response = await request(app)
      .post("/api/v0.0.0/eas/score")
      .send({ recipient, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body.passport.multiAttestationRequest).toEqual(mockMultiAttestationRequestWithScore);
    expect(response.body.passport.nonce).toEqual(nonce);
    expect(formatMultiAttestationRequestSpy).toBeCalled();
  });

  it("handles error during the formatting of the score", async () => {
    formatMultiAttestationRequestSpy.mockRejectedValue(new IAMError("Formatting error"));

    const nonce = 0;
    const recipient = "0x5678000000000000000000000000000000000000";

    const response = await request(app)
      .post("/api/v0.0.0/eas/score")
      .send({ recipient, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(500)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Error formatting onchain score, IAMError: Formatting error");
  });
});
