import { jest, it, describe, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("axios", () => {
  return {
    default: {
      get: jest.fn(),
      isAxiosError: jest.fn(),
    },
  };
});

jest.unstable_mockModule("moralis", () => ({
  default: {
    EvmApi: {
      token: {
        getTokenPrice: jest.fn().mockResolvedValue({
          result: { usdPrice: 3000 },
        }),
      },
    },
  },
}));

import request from "supertest";
import { PassportCache } from "@gitcoin/passport-platforms";

const { app } = await import("../src/index.js");

import { MultiAttestationRequest, ZERO_BYTES32, NO_EXPIRATION } from "@ethereum-attestation-service/eas-sdk";

const identityMock = await import("@gitcoin/passport-identity");
const easSchemaMock = await import("../src/utils/easStampSchema.js");

const { toJsonObject } = await import("../src/utils/json.js");
const {
  default: { get },
} = await import("axios");
const mockedAxiosGet = get as jest.Mock;

const chainIdHex = "0xa";
const mockRecipient = "0x5678000000000000000000000000000000000000";

const mockMultiAttestationRequestWithScore: MultiAttestationRequest[] = [
  {
    schema: "0x6ab5d34260fca0cfcf0e76e96d439cace6aa7c3c019d7c4580ed52c6845e9c89", // This is configured in onchain info for chain "0xa"
    data: [
      {
        recipient: mockRecipient,
        data: easSchemaMock.encodeEasScore({
          score: 23.45,
          scorer_id: parseInt(process.env.ALLO_SCORER_ID || ""),
        }),
        expirationTime: NO_EXPIRATION,
        revocable: true,
        refUID: ZERO_BYTES32,
        value: BigInt("0"),
      },
    ],
  },
];

describe("POST /eas/score", () => {
  beforeEach(() => {});

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
    mockedAxiosGet.mockImplementationOnce(
      async (): Promise<any> => ({
        data: {
          status: "DONE",
          evidence: {
            rawScore: "23.45",
          },
        },
      })
    );

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

    expect(response.body.passport.multiAttestationRequest).toEqual(toJsonObject(mockMultiAttestationRequestWithScore));
    expect(response.body.passport.nonce).toEqual(nonce);
  });

  it("handles error during the formatting of the score", async () => {
    mockedAxiosGet.mockImplementationOnce(async (): Promise<any> => {
      throw new Error("Formatting error");
    });

    const nonce = 0;
    const recipient = "0x5678000000000000000000000000000000000000";

    const response = await request(app)
      .post("/api/v0.0.0/eas/score")
      .send({ recipient, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(500)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Error formatting onchain score, Error: Formatting error");
  });
});
