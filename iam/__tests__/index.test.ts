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

jest.unstable_mockModule("../src/utils/identityHelper.js", async () => {
  const originalIdentity = await import("@gitcoin/passport-identity");
  return {
    ...originalIdentity,
    verifyCredential: jest.fn(originalIdentity.verifyCredential),
  };
});

jest.unstable_mockModule("axios", () => {
  return {
    default: {
      get: jest.fn(),
      isAxiosError: jest.fn(),
    },
    AxiosError: jest.fn(),
  };
});

import request from "supertest";
import { PassportCache, providers } from "@gitcoin/passport-platforms";
const {
  default: { get },
} = await import("axios");
const mockedAxiosGet = get as jest.Mock;

const { app } = await import("../src/index.js");

import {
  ErrorResponseBody,
  ProviderContext,
  RequestPayload,
  ValidResponseBody,
  VerifiableCredential,
  VerifiedPayload,
} from "@gitcoin/passport-types";

import { MultiAttestationRequest, ZERO_BYTES32, NO_EXPIRATION } from "@ethereum-attestation-service/eas-sdk";

const identityMock = await import("../src/utils/identityHelper.js");
const easStampSchema = await import("../src/utils/easStampSchema.js");

const { IAMError } = await import("../src/utils/scorerService.js");
const { toJsonObject } = await import("../src/utils/json.js");

const issuer = identityMock.getEip712Issuer();

const MOCK_ADDRESS = "0xcF314CE817E25B4f784BC1F24C9a79a525fEc50f";

const chainIdHex = "0xa";

describe("POST /challenge", function () {
  it("handles valid challenge requests", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      type: "Simple",
      address: MOCK_ADDRESS,
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = `did:pkh:eip155:1:${MOCK_ADDRESS}`;

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // expect the mocked credential to be returned and contain the expectedId
    // TODO: geri check for the signature type ...
    expect((response.body as ValidResponseBody)?.credential?.credentialSubject?.id).toEqual(expectedId);
  });

  it("handles valid challenge request with signatureType", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      type: "Simple",
      address: MOCK_ADDRESS,
      signatureType: "EIP712",
    };

    // check that ID matches the payload (this has been mocked)
    const expectedId = `did:pkh:eip155:1:${MOCK_ADDRESS}`;

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // expect the mocked credential to be returned and contain the expectedId
    // TODO: geri check for the signature type ...
    expect((response.body as ValidResponseBody)?.credential?.credentialSubject?.id).toEqual(expectedId);
  });

  it("handles missing address from the challenge request body", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      type: "Simple",
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    // expect the mocked credential to be returned and contain the expectedId
    expect((response.body as ErrorResponseBody).error).toEqual("Missing address from challenge request body");
  });

  it("handles missing type from the challenge request body", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      address: "0x0",
    };

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    // expect the mocked credential to be returned and contain the expectedId
    expect((response.body as ErrorResponseBody).error).toEqual("Missing type from challenge request body");
  });

  it("handles malformed payload from the challenge request body", async () => {
    // as each signature is unique, each request results in unique output
    const payload = "bad :(";

    // create a req against the express app
    const response = await request(app)
      .post("/api/v0.0.0/challenge")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);
  });
});

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

describe("POST /check", function () {
  it("handles valid check requests", async () => {
    const payload = {
      type: "Simple",
      address: "0x0",
      proofs: {
        valid: "true",
      },
    };

    const response = await request(app)
      .post("/api/v0.0.0/check")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body[0].valid).toBe(true);
    expect(response.body[0].type).toEqual("Simple");
  });

  it("handles valid check request with AllowListStamp", async () => {
    const allowProvider = "AllowList#test";
    jest
      .spyOn(providers._providers.AllowList, "verify")
      .mockImplementation(async (payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> => {
        return {
          valid: true,
          record: {
            allowList: "test",
          },
        };
      });
    const payload = {
      types: ["Simple", allowProvider],
      address: "0x0",
      proofs: {
        valid: "true",
      },
    };

    const response = await request(app)
      .post("/api/v0.0.0/check")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body[1].valid).toBe(true);
    expect(response.body[1].type).toEqual("AllowList#test");
  });

  it("handles valid check request with DeveloperList stamp", async () => {
    const customGithubProvider = "DeveloperList#test#0xtest";
    jest
      .spyOn(providers._providers.DeveloperList, "verify")
      .mockImplementation(async (payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> => {
        return {
          valid: true,
          record: {
            conditionName: "test",
            conditionHash: "0xtest",
          },
        };
      });
    const payload = {
      types: ["Simple", customGithubProvider],
      address: "0x0",
      proofs: {
        valid: "true",
      },
    };

    const response = await request(app)
      .post("/api/v0.0.0/check")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body[1].valid).toBe(true);
    expect(response.body[1].type).toEqual("DeveloperList#test#0xtest");
  });

  it("handles valid check requests with multiple types", async () => {
    const payload = {
      types: ["Simple", "AnotherType"],
      address: "0x0",
      proofs: {
        valid: "true",
      },
    };

    const response = await request(app)
      .post("/api/v0.0.0/check")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body.length).toBe(2);

    const simple = response.body.find((item: any) => item.type === "Simple");
    const anotherType = response.body.find((item: any) => item.type === "AnotherType");

    expect(simple.valid).toBe(true);
    expect(anotherType.valid).toBe(false);
    expect(anotherType.error).toBeDefined();
    expect(anotherType.code).toBeDefined();
  });

  it("handles missing payload in the check request body", async () => {
    const response = await request(app)
      .post("/api/v0.0.0/check")
      .send({})
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Incorrect payload");
  });

  it("handles malformed payload in the check request body", async () => {
    const payload = "bad :(";

    const response = await request(app)
      .post("/api/v0.0.0/check")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Incorrect payload");
  });

  it("handles empty types array in the check request body", async () => {
    const payload = {
      types: [] as unknown as string[],
      address: "0x0",
    };

    const response = await request(app)
      .post("/api/v0.0.0/check")
      .send({ payload })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body.length).toEqual(0);
  });
});

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

describe("POST /eas/passport", () => {
  beforeEach(() => {});

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("handles missing stamps in the request body", async () => {
    const nonce = 0;
    const credentials: VerifiableCredential[] = [];
    const response = await request(app)
      .post("/api/v0.0.0/eas/passport")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("No stamps provided");
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
      .post("/api/v0.0.0/eas/passport")
      .send({ credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Invalid recipient");
  });

  it("should throw a 400 error if every credentialSubject.id is not equivalent", async () => {
    const nonce = 0;
    const recipient = "0x5678000000000000000000000000000000000001";
    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: "did:pkh:eip155:1:0x5678000000000000000000000000000000000002",
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
          id: "did:pkh:eip155:1:0x5678000000000000000000000000000000000003",
          provider: "test1",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const response = await request(app)
      .post("/api/v0.0.0/eas/passport")
      .send({ recipient, credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Every credential's id must be equivalent to that of the recipient");
  });

  it("successfully verifies and formats passport", async () => {
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
    jest.spyOn(PassportCache.prototype, "get").mockImplementation((key: any) => {
      if (key === "ethPrice") {
        return Promise.resolve("3000");
      } else if (key === "ethPriceLastUpdate") {
        return Promise.resolve((Date.now() - 1000 * 60 * 6).toString());
      }
    });
    const nonce = 0;
    const recipient = "0x5678000000000000000000000000000000000000";
    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: `did:pkh:eip155:1:${recipient}`,
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const response = await request(app)
      .post("/api/v0.0.0/eas/passport")
      .send({ recipient, credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(200)
      .expect("Content-Type", /json/);

    // TODO: geri, use snapshot here?
    const expectedValue = [
      {
        schema: "0xd7b8c4ffa4c9fd1ecb3f6db8201e916a8d7dba11f161c1b0b5ccf44ceb8e2a39",
        data: [
          {
            recipient: "0x5678000000000000000000000000000000000000",
            expirationTime: "0",
            revocable: true,
            refUID: "0x0000000000000000000000000000000000000000000000000000000000000000",
            value: "0",
            data: "0x00000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000000000000000000000000000c000000000000000000000000000000000000000000000000000000000000000e0000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
          },
        ],
      },
      {
        schema: "0x6ab5d34260fca0cfcf0e76e96d439cace6aa7c3c019d7c4580ed52c6845e9c89",
        data: [
          {
            recipient: "0x5678000000000000000000000000000000000000",
            expirationTime: "0",
            revocable: true,
            refUID: "0x0000000000000000000000000000000000000000000000000000000000000000",
            value: "0",
            data: "0x1234567890abcdef",
          },
        ],
      },
    ];

    // expect(response.body.passport.multiAttestationRequest).toEqual(
    //   toJsonObject(mockMultiAttestationRequestWithPassportAndScore)
    // );
    expect(response.body.passport.multiAttestationRequest).toEqual(toJsonObject(expectedValue));

    expect(response.body.passport.nonce).toEqual(nonce);
    expect(identityMock.verifyCredential).toHaveBeenCalledTimes(credentials.length);
  });

  it("handles error during the formatting of the passport", async () => {
    // We'll just trigger an error via the axios get, because this will be called in order to get the score ...
    mockedAxiosGet.mockRejectedValue(new IAMError("Formatting error"));

    const nonce = 0;
    const recipient = "0x5678000000000000000000000000000000000000";
    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: `did:pkh:eip155:1:${recipient}`,
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const response = await request(app)
      .post("/api/v0.0.0/eas/passport")
      .send({ recipient, credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(500)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Error formatting onchain passport, IAMError: Formatting error");
  });

  it("handles error during credential verification", async () => {
    (identityMock.verifyCredential as jest.Mock).mockRejectedValueOnce(new Error("Verification error"));

    const nonce = 0;
    const recipient = "0x5678000000000000000000000000000000000000";
    const credentials = [
      {
        "@context": "https://www.w3.org/2018/credentials/v1",
        type: ["VerifiableCredential", "Stamp"],
        issuer: issuer,
        issuanceDate: new Date().toISOString(),
        credentialSubject: {
          id: `did:pkh:eip155:1:${recipient}`,
          provider: "test",
          hash: "v0.0.0:8JZcQJy6uwNGPDZnvfGbEs6mf5OZVD1mUOdhKNrOHls=",
        },
        expirationDate: "9999-12-31T23:59:59Z",
      },
    ];

    const response = await request(app)
      .post("/api/v0.0.0/eas/passport")
      .send({ recipient, credentials, nonce, chainIdHex })
      .set("Accept", "application/json")
      .expect(500)
      .expect("Content-Type", /json/);

    expect(response.body.error).toEqual("Error formatting onchain passport, Error: Verification error");
  });
});

describe("verifyTypes", () => {});
