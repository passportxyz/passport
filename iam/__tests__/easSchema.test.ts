import { encodeEasStamp, formatMultiAttestationRequest } from "../src/utils/easSchema";
import * as encodeEasStampModule from "../src/utils/easSchema";
import { VerifiableCredential } from "@gitcoin/passport-types";
import { BigNumber } from "ethers";
import { NO_EXPIRATION, ZERO_BYTES32 } from "@ethereum-attestation-service/eas-sdk";

describe("easSchema", () => {
  it("returns a valid encoded schema", () => {
    const verifiableCredential: VerifiableCredential = {
      "@context": [],
      type: [],
      credentialSubject: {
        hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        provider: "SomeProvider",
        id: "",
        "@context": [{}],
      },
      issuer: "string",
      issuanceDate: "string",
      expirationDate: "string",
      proof: {
        type: "string",
        proofPurpose: "string",
        verificationMethod: "string",
        created: "string",
        jws: "string",
      },
    };

    const encodedData = encodeEasStamp(verifiableCredential);
  });
});

jest.mock("../src/utils/scorerService", () => ({
  fetchEncodedPassportScore: jest.fn().mockResolvedValue("mockEncodedScore"),
}));

const defaultRequestData = {
  recipient: "0x123",
  expirationTime: NO_EXPIRATION,
  revocable: true,
  refUID: ZERO_BYTES32,
  value: 0,
};

describe("formatMultiAttestationRequest", () => {
  beforeEach(() => {});
  it("should return formatted attestation request", async () => {
    const validatedCredentials = [
      {
        credential: {
          credentialSubject: {
            provider: "mockCredential1",
            hash: "v0.0.0:QdjFB8E6FbvBT8HP+4mr7VBjal+CC7aDcAAqGAKsXos=",
          },
        } as unknown as VerifiableCredential,
        verified: true,
      },
      {
        credential: {
          credentialSubject: {
            provider: "mockCredential2",
            hash: "v0.0.0:QdjFB8E6FbvBT8HP+4mr7VBjal+CC7aDcAAqGAKsXos=",
          },
        } as unknown as VerifiableCredential,
        verified: false,
      },
    ];

    const recipient = "0x123";
    const dbAccessToken = "mockAccessToken";

    const result = await formatMultiAttestationRequest(validatedCredentials, recipient, dbAccessToken);

    expect(result).toEqual([
      {
        schema: process.env.EAS_GITCOIN_STAMP_SCHEMA,
        data: [
          {
            ...defaultRequestData,
            data: "0xf16d3efd2054045b9debcc6eadf39c4d2cb45876dd5bd3d168b64a3bbd40aa9841d8c507c13a15bbc14fc1cffb89abed50636a5f820bb68370002a1802ac5e8b",
          },
        ],
      },
      {
        schema: process.env.EAS_GITCOIN_SCORE_SCHEMA,
        data: [
          {
            ...defaultRequestData,
            data: "mockEncodedScore",
          },
        ],
      },
    ]);
  });
});
