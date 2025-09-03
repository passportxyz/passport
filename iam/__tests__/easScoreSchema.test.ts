const passportOnchainInfo = require("../../deployments/onchainInfo.json");
import { ZERO_BYTES32 } from "@ethereum-attestation-service/eas-sdk";
import { ATTESTATION_SCHEMA_ENCODER, generateScoreAttestationRequest } from "../src/utils/easScoreSchema";
import axios from "axios";

const formatDate = (date: Date): string =>
  date
    .toISOString()
    .replace(/\.\d{3}/, (match) => match + "000")
    .replace("Z", "+00:00");

jest.mock("axios");

describe("generateScoreAttestationRequest", () => {
  const recipient = "0x123";
  const now = new Date();
  const expiration = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
  const defaultRequestData = {
    recipient: "0x123",
    expirationTime: BigInt(Math.floor(expiration.getTime() / 1000)),
    revocable: true,
    refUID: ZERO_BYTES32,
    value: BigInt(0),
  };

  beforeAll(() => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        data: {
          address: recipient,
          score: "30.10011",
          passing_score: true,
          last_score_timestamp: formatDate(now),
          expiration_timestamp: formatDate(expiration),
          threshold: "20.00000",
          error: null,
          stamps: {
            NFT: {
              score: "20.00011",
              dedup: false,
              expiration_date: formatDate(expiration),
            },
            CoinbaseDualVerification2: {
              score: "10.10000",
              dedup: false,
              expiration_date: formatDate(expiration),
            },
          },
        },
      });
    });
  });

  it("should return formatted score v2 request", async () => {
    const chainIdHex = "0xaa37dc";
    const result = await generateScoreAttestationRequest({
      recipient,
      chainIdHex,
    });

    const scoreSchema = passportOnchainInfo[chainIdHex].easSchemas.scoreV2.uid;

    expect(result).toEqual([
      {
        schema: scoreSchema,
        data: [
          {
            ...defaultRequestData,
            data: expect.any(String),
          },
        ],
      },
    ]);

    const encodedData = result[0].data[0].data;
    const decodedScoreData = ATTESTATION_SCHEMA_ENCODER.decodeData(encodedData);
    expect(decodedScoreData).toEqual([
      {
        name: "passing_score",
        type: "bool",
        signature: "bool passing_score",
        value: { name: "passing_score", type: "bool", value: true },
      },
      {
        name: "score_decimals",
        type: "uint8",
        signature: "uint8 score_decimals",
        value: { name: "score_decimals", type: "uint8", value: 4n },
      },
      {
        name: "scorer_id",
        type: "uint128",
        signature: "uint128 scorer_id",
        value: { name: "scorer_id", type: "uint128", value: 1n },
      },
      {
        name: "score",
        type: "uint32",
        signature: "uint32 score",
        value: { name: "score", type: "uint32", value: 301001n },
      },
      {
        name: "threshold",
        type: "uint32",
        signature: "uint32 threshold",
        value: { name: "threshold", type: "uint32", value: 200000n },
      },
      {
        name: "stamps",
        type: "(string,uint256)[]",
        signature: "(string provider,uint256 score)[] stamps",
        value: {
          name: "stamps",
          type: "(string,uint256)[]",
          value: [
            [
              {
                name: "provider",
                type: "string",
                value: "NFT",
              },
              {
                name: "score",
                type: "uint256",
                value: 200001n,
              },
            ],
            [
              {
                name: "provider",
                type: "string",
                value: "CoinbaseDualVerification2",
              },
              {
                name: "score",
                type: "uint256",
                value: 101000n,
              },
            ],
          ],
        },
      },
    ]);
  });

  it("should return formatted score v2 request for alternate scorer", async () => {
    const chainIdHex = "0xaa37dc";
    const scorerId = 123;
    const result = await generateScoreAttestationRequest({
      recipient,
      chainIdHex,
      customScorerId: scorerId,
    });

    const scoreSchema = passportOnchainInfo[chainIdHex].easSchemas.scoreV2.uid;

    expect(result).toEqual([
      {
        schema: scoreSchema,
        data: [
          {
            ...defaultRequestData,
            data: expect.any(String),
          },
        ],
      },
    ]);

    const encodedData = result[0].data[0].data;
    const decodedScoreData = ATTESTATION_SCHEMA_ENCODER.decodeData(encodedData);
    expect(decodedScoreData[2]).toEqual({
      name: "scorer_id",
      type: "uint128",
      signature: "uint128 scorer_id",
      value: { name: "scorer_id", type: "uint128", value: 123n },
    });
  });
});
