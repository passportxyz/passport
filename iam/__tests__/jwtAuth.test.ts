import request from "supertest";
import { jest, describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { CredentialResponseBody, ValidResponseBody } from "@gitcoin/passport-types";

import { app } from "../src/index.js";
import * as identityMock from "../src/utils/identityHelper";
import * as scorerJwtMock from "../src/utils/scorerJwt";

// Mock the scorerJwt module
jest.mock("../src/utils/scorerJwt", () => ({
  verifyAndExtractAddress: jest.fn(),
  extractBearerToken: jest.fn(),
}));

jest.mock("../src/utils/revocations", () => ({
  filterRevokedCredentials: jest.fn().mockImplementation((input) => Promise.resolve(input)),
}));

jest.mock("../src/utils/identityHelper", () => {
  const originalIdentity = jest.requireActual("../src/utils/identityHelper");
  return {
    ...originalIdentity,
    verifyCredential: jest.fn(async () => Promise.resolve(true)),
    hasValidIssuer: jest.fn(() => true),
    verifyChallengeAndGetAddress: jest.fn(),
    verifyProvidersAndIssueCredentials: jest.fn(),
  };
});

const verifyAndExtractAddress = scorerJwtMock.verifyAndExtractAddress as jest.MockedFunction<
  typeof scorerJwtMock.verifyAndExtractAddress
>;
const extractBearerToken = scorerJwtMock.extractBearerToken as jest.MockedFunction<
  typeof scorerJwtMock.extractBearerToken
>;
const verifyProvidersAndIssueCredentialsMock = identityMock.verifyProvidersAndIssueCredentials as jest.Mock;
const verifyChallengeAndGetAddress = identityMock.verifyChallengeAndGetAddress as jest.Mock;
const issuerDid = identityMock.getIssuerInfo().issuer.did;

const getMockCredential = (provider: string, address: string) => ({
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  type: ["VerifiableCredential", "Stamp"],
  issuer: issuerDid,
  issuanceDate: new Date().toISOString(),
  credentialSubject: {
    "@context": {},
    id: `did:pkh:eip155:1:${address}`,
    provider: provider,
    hash: "v0.0.0:test-hash",
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
      domain: { name: "name" },
      primaryType: "primaryType",
      types: {} as any,
    },
  },
});

describe("POST /verify with JWT authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementation for credential issuance
    verifyProvidersAndIssueCredentialsMock.mockImplementation(async (providersByPlatform, address) => {
      const credentials: CredentialResponseBody[] = [];
      providersByPlatform.forEach((providers: string[]) => {
        providers.forEach((provider: string) => {
          credentials.push({
            credential: getMockCredential(provider, address),
            record: { type: "test-record", version: "v0.0.0" },
          });
        });
      });
      return { credentials, timings: { platforms: {} } };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("handles valid JWT authentication without challenge", async () => {
    const testAddress = "0x1234567890123456789012345678901234567890";

    // Mock JWT extraction and verification
    extractBearerToken.mockReturnValue("valid-jwt-token");
    verifyAndExtractAddress.mockReturnValue(testAddress.toLowerCase());

    const payload = {
      type: "Simple",
      types: ["Simple"],
      address: testAddress,
      proofs: { valid: "true" },
    };

    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .set("Authorization", "Bearer valid-jwt-token")
      .send({ payload }) // No challenge needed with JWT
      .expect(200)
      .expect("Content-Type", /json/);

    // Verify the response contains credentials
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    const credential = (response.body as ValidResponseBody[])[0];
    expect(credential.credential.credentialSubject.id).toEqual(`did:pkh:eip155:1:${testAddress.toLowerCase()}`);

    // Verify JWT functions were called
    expect(extractBearerToken).toHaveBeenCalledWith("Bearer valid-jwt-token");
    expect(verifyAndExtractAddress).toHaveBeenCalledWith("valid-jwt-token");

    // Verify challenge-based auth was NOT used
    expect(verifyChallengeAndGetAddress).not.toHaveBeenCalled();
  });

  it("handles invalid JWT and falls back to challenge auth", async () => {
    const testAddress = "0x1234567890123456789012345678901234567890";

    // Mock JWT extraction but verification fails
    extractBearerToken.mockReturnValue("invalid-jwt-token");
    verifyAndExtractAddress.mockReturnValue(null); // JWT verification failed

    // Mock challenge-based auth
    verifyChallengeAndGetAddress.mockResolvedValue(testAddress);

    const challenge = {
      issuer: issuerDid,
      credentialSubject: {
        id: `did:pkh:eip155:1:${testAddress}`,
        provider: "challenge-Simple",
        address: testAddress,
        challenge: "test-challenge",
      },
    };

    const payload = {
      type: "Simple",
      types: ["Simple"],
      address: testAddress,
      proofs: { valid: "true", signature: "test-sig" },
    };

    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .set("Authorization", "Bearer invalid-jwt-token")
      .send({ challenge, payload })
      .expect(200)
      .expect("Content-Type", /json/);

    // Verify fallback to challenge auth
    expect(verifyChallengeAndGetAddress).toHaveBeenCalled();
    expect(Array.isArray(response.body)).toBe(true);
  });

  it("returns 401 when no JWT and no challenge provided", async () => {
    // Mock no JWT present
    extractBearerToken.mockReturnValue(null);

    const payload = {
      type: "Simple",
      types: ["Simple"],
      address: "0x1234567890123456789012345678901234567890",
      proofs: { valid: "true" },
    };

    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .send({ payload }) // No Authorization header, no challenge
      .expect(401)
      .expect("Content-Type", /json/);

    expect(response.body.error).toContain("Missing challenge");
  });

  it("uses address from JWT token, not from payload", async () => {
    const jwtAddress = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const payloadAddress = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    extractBearerToken.mockReturnValue("valid-jwt-token");
    verifyAndExtractAddress.mockReturnValue(jwtAddress.toLowerCase());

    const payload = {
      type: "Simple",
      types: ["Simple"],
      address: payloadAddress, // Different from JWT address
      proofs: { valid: "true" },
    };

    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .set("Authorization", "Bearer valid-jwt-token")
      .send({ payload })
      .expect(200);

    // The credential should use the JWT address, not the payload address
    const credential = (response.body as ValidResponseBody[])[0];
    expect(credential.credential.credentialSubject.id).toEqual(`did:pkh:eip155:1:${jwtAddress.toLowerCase()}`);
  });

  it("handles JWT auth with multiple provider types", async () => {
    const testAddress = "0x1234567890123456789012345678901234567890";

    extractBearerToken.mockReturnValue("valid-jwt-token");
    verifyAndExtractAddress.mockReturnValue(testAddress.toLowerCase());

    const payload = {
      type: "EVMBulkVerify",
      types: ["Github", "Discord", "Google"],
      address: testAddress,
      proofs: {},
    };

    const response = await request(app)
      .post("/api/v0.0.0/verify")
      .set("Authorization", "Bearer valid-jwt-token")
      .send({ payload })
      .expect(200);

    // Should return credentials for all requested types
    expect(response.body).toHaveLength(3);
    expect(verifyChallengeAndGetAddress).not.toHaveBeenCalled();
  });
});
