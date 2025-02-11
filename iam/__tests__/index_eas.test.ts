import { jest, it, describe, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("../src/utils/revocations.js", () => ({
  filterRevokedCredentials: jest.fn().mockImplementation((input) => Promise.resolve(input)),
}));

jest.unstable_mockModule("../src/utils/easStampSchema.js", () => ({
  formatMultiAttestationRequest: jest.fn(),
  encodeEasScore: jest.fn(() => {
    return "0x1234567890abcdef";
  }),
}));

jest.unstable_mockModule("../src/utils/easFees.js", () => ({
  getEASFeeAmount: jest.fn(),
}));

jest.unstable_mockModule("../src/utils/identityHelper.js", async () => {
  const originalIdentity = await import("@gitcoin/passport-identity");
  return {
    ...originalIdentity,
    verifyCredential: jest.fn(originalIdentity.verifyCredential),
  };
});

import request from "supertest";
import {
  VerifiableCredential,
} from "@gitcoin/passport-types";

import { MultiAttestationRequest, ZERO_BYTES32, NO_EXPIRATION } from "@ethereum-attestation-service/eas-sdk";

const { app } = await import("../src/index.js");
const { getAttestationDomainSeparator } = await import("../src/utils/attestations.js");
const { parseEther } = await import("ethers");
const easFees = await import("../src/utils/easFees.js");
const identityMock = await import("../src/utils/identityHelper.js");
const easStampSchema = await import("../src/utils/easStampSchema.js");
const { toJsonObject } = await import("../src/utils/json.js");

const issuer = identityMock.getEip712Issuer();
const formatMultiAttestationRequestMock = easStampSchema.formatMultiAttestationRequest as jest.Mock;
const getEASFeeAmountMock = easFees.getEASFeeAmount as jest.Mock;
const verifyCredentialMock = identityMock.verifyCredential as jest.Mock;

const chainIdHex = "0xa";

const mockRecipient = "0x5678000000000000000000000000000000000000";
const mockMultiAttestationRequestWithPassportAndScore: MultiAttestationRequest[] = [
  {
    schema: "0xd7b8c4ffa4c9fd1ecb3f6db8201e916a8d7dba11f161c1b0b5ccf44ceb8e2a39",
    data: [
      {
        recipient: mockRecipient,
        data: easStampSchema.encodeEasScore({
          score: 23.45,
          scorer_id: 123,
        }),
        expirationTime: NO_EXPIRATION,
        revocable: true,
        refUID: ZERO_BYTES32,
        value: BigInt("0"),
      },
    ],
  },
  {
    schema: "0x6ab5d34260fca0cfcf0e76e96d439cace6aa7c3c019d7c4580ed52c6845e9c89",
    data: [
      {
        recipient: mockRecipient,
        data: easStampSchema.encodeEasScore({
          score: 23.45,
          scorer_id: 123,
        }),
        expirationTime: NO_EXPIRATION,
        revocable: true,
        refUID: ZERO_BYTES32,
        value: BigInt("0"),
      },
    ],
  },
];

describe("POST /eas", () => {
  beforeEach(() => {
    getEASFeeAmountMock.mockReturnValue(Promise.resolve(parseEther("0.025")));
  });

  afterEach(() => {
    // restore the spy created with spyOn
    jest.restoreAllMocks();
  });

  it("handles valid requests including some invalid credentials", async () => {
    formatMultiAttestationRequestMock.mockReturnValue(Promise.resolve(mockMultiAttestationRequestWithPassportAndScore));
    const nonce = 0;
    const failedCredential = {
      "@context": "https://www.w3.org/2018/credentials/v1",
      type: ["VerifiableCredential", "Stamp"],
      issuer: "BAD_ISSUER",
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: "did:pkh:eip155:1:0x5678000000000000000000000000000000000000",
        provider: "failure",
        hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
      },
      expirationDate: "9999-12-31T23:59:59Z",
    };

    const credentials = [failedCredential];

    const expectedPayload = {
      error: {
        invalidCredentials: [failedCredential],
      },
    };

    const response = await request(app)
      .post("/api/v0.0.0/eas")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual(expectedPayload);
  });

  it("properly formats domain separator", () => {
    const domainSeparator = getAttestationDomainSeparator("0xa");
    expect(domainSeparator).toEqual({
      name: "GitcoinVerifier",
      version: "1",
      chainId: "10",
      verifyingContract: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
    });
  });

  it("handles request with only invalid credentials", async () => {
    formatMultiAttestationRequestMock.mockReturnValue(Promise.resolve([]));
    const nonce = 0;
    const failedCredential = {
      "@context": "https://www.w3.org/2018/credentials/v1",
      type: ["VerifiableCredential", "Stamp"],
      issuer: "BAD_ISSUER",
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: "did:pkh:eip155:1:0x5678000000000000000000000000000000000000",
        provider: "failure",
        hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
      },
      expirationDate: "9999-12-31T23:59:59Z",
    };

    const credentials = [failedCredential];
    const expectedPayload = {
      error: {
        invalidCredentials: [failedCredential],
      },
    };

    const response = await request(app)
      .post("/api/v0.0.0/eas")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual(expectedPayload);
  });

  it("handles missing stamps in the request body", async () => {
    const nonce = 0;
    const credentials: VerifiableCredential[] = [];
    const response = await request(app)
      .post("/api/v0.0.0/eas")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("No stamps provided");
  });

  it("handles bad chain ID", async () => {
    const nonce = 0;
    const credentials: VerifiableCredential[] = [];
    const response = await request(app)
      .post("/api/v0.0.0/eas")
      .send({ credentials, nonce, chainIdHex: "0x694206969" })
      .set("Accept", "application/json")
      .expect(404)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("No onchainInfo found for chainId 0x694206969");
  });

  it("handles invalid recipient in the request body", async () => {
    const nonce = 0;
    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: "did:pkh:eip155:1:0x5678",
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const response = await request(app)
      .post("/api/v0.0.0/eas")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Invalid recipient");
  });

  it("returns the fee information in the response as wei units", async () => {
    verifyCredentialMock.mockImplementationOnce(async () => {
      return Promise.resolve(true);
    });

    formatMultiAttestationRequestMock.mockReturnValue(Promise.resolve(mockMultiAttestationRequestWithPassportAndScore));
    const nonce = 0;
    const expectedFeeUsd = parseFloat(process.env.EAS_FEE_USD);

    expect(expectedFeeUsd).toBeDefined();
    expect(typeof expectedFeeUsd).toBe("number");
    expect(expectedFeeUsd).toBeGreaterThan(1);

    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: "did:pkh:eip155:1:0x5678000000000000000000000000000000000000",
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const expectedPayload = {
      passport: {
        multiAttestationRequest: toJsonObject(mockMultiAttestationRequestWithPassportAndScore),
        fee: "25000000000000000",
        nonce,
      },
      signature: expect.any(Object),
      invalidCredentials: [] as VerifiableCredential[],
    };

    const response = await request(app)
      .post("/api/v0.0.0/eas")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toMatchObject(expectedPayload);
    expect(getEASFeeAmountMock).toHaveBeenCalledTimes(1);
    expect(getEASFeeAmountMock).toHaveBeenCalledWith(expectedFeeUsd);
  });
  it("should throw a 400 error if every credentialSubject.id is not equivalent", async () => {
    const nonce = 0;
    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: "did:pkh:eip155:1:0x5678000000000000000000000000000000000000",
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: "did:pkh:eip155:1:0x5678000000000000000000000000000000000001",
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHla=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const response = await request(app)
      .post("/api/v0.0.0/eas")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json");
    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Every credential's id must be equivalent");
  });
});
