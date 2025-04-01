import { jest, it, describe, expect } from "@jest/globals";

import request from "supertest";
import { providers } from "@gitcoin/passport-platforms";
import { app } from "../src/index.js";

import {
  ErrorResponseBody,
  ProviderContext,
  RequestPayload,
  ValidResponseBody,
  VerifiableCredential,
  VerifiedPayload,
} from "@gitcoin/passport-types";

jest.mock("../src/utils/revocations", () => ({
  filterRevokedCredentials: jest.fn().mockImplementation((input) => Promise.resolve(input)),
}));

jest.mock("../src/utils/identityHelper", () => {
  const originalIdentity =
    jest.requireActual<typeof import("../src/utils/identityHelper")>("../src/utils/identityHelper");
  return {
    ...originalIdentity,
    verifyCredential: jest.fn(originalIdentity.verifyCredential),
  };
});

jest.mock("../src/utils/easFees", () => ({
  getEASFeeAmount: jest.fn(() => Promise.resolve(BigInt(0))),
}));

jest.mock("axios");

const MOCK_ADDRESS = "0xcF314CE817E25B4f784BC1F24C9a79a525fEc50f";

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
        types: {
          "@context": {} as any,
        },
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
      .mockImplementation(async (payload: RequestPayload, context?: ProviderContext): Promise<VerifiedPayload> => {
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
      .mockImplementation(async (payload: RequestPayload, context?: ProviderContext): Promise<VerifiedPayload> => {
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
