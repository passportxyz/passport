import { jest, it, describe, expect, beforeEach, afterEach } from "@jest/globals";
import request from "supertest";
import { app } from "../src/server.js";
import {
  verifyProvidersAndIssueCredentials,
  verifyCredential,
  hasValidIssuer,
  verifyChallengeAndGetAddress,
} from "../src/utils/identityHelper.js";
import * as scorerJwtMock from "../src/utils/scorerJwt.js";
import axios from "axios";

jest.mock("axios");

jest.mock("../src/utils/scorerJwt", () => ({
  verifyAndExtractAddress: jest.fn(),
  extractBearerToken: jest.fn(),
}));

jest.mock("../src/utils/identityHelper", () => ({
  ...jest.requireActual<typeof import("../src/utils/identityHelper")>("../src/utils/identityHelper"),
  verifyProvidersAndIssueCredentials: jest.fn(),
  verifyCredential: jest.fn(),
  hasValidIssuer: jest.fn(),
  verifyChallengeAndGetAddress: jest.fn(),
  groupProviderTypesByPlatform: jest.fn((types) => [types]),
}));

const mockedVerifyProvidersAndIssueCredentials = verifyProvidersAndIssueCredentials as jest.MockedFunction<
  typeof verifyProvidersAndIssueCredentials
>;
const mockedVerifyCredential = verifyCredential as jest.MockedFunction<typeof verifyCredential>;
const mockedHasValidIssuer = hasValidIssuer as jest.MockedFunction<typeof hasValidIssuer>;
const mockedVerifyChallengeAndGetAddress = verifyChallengeAndGetAddress as jest.MockedFunction<
  typeof verifyChallengeAndGetAddress
>;

const verifyAndExtractAddress = scorerJwtMock.verifyAndExtractAddress as jest.MockedFunction<
  typeof scorerJwtMock.verifyAndExtractAddress
>;
const extractBearerToken = scorerJwtMock.extractBearerToken as jest.MockedFunction<
  typeof scorerJwtMock.extractBearerToken
>;

const mockChallenge = {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  type: ["VerifiableCredential", "Challenge"],
  credentialSubject: {
    id: "did:pkh:eip155:1:0x0000000000000000000000000000000000000000",
    provider: "challenge-EVMBulkVerify",
  },
  issuer: "did:key:test-issuer",
  issuanceDate: new Date().toISOString(),
  expirationDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  proof: {} as any,
};

const mockPayload = {
  type: "EVMBulkVerify",
  types: ["provider-1", "provider-2"],
  address: "0x0000000000000000000000000000000000000000",
  signatureType: "EIP712" as const,
  version: "0.0.0",
  proofs: {},
};

const mockScore = {
  score: "12",
  threshold: "20.000",
  passing_score: true,
  address: "0x0000000000000000000000000000000000000000",
  last_score_timestamp: new Date().toISOString(),
  expiration_timestamp: new Date().toISOString(),
  error: "",
  stamps: {},
};

describe("POST /embed/verify with JWT authentication", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock rate limit check
    (axios.get as jest.Mock).mockResolvedValue({
      data: { embed_rate_limit: "125/15m" },
    });

    // Default mocks for challenge-based auth
    mockedVerifyCredential.mockResolvedValue(true);
    mockedHasValidIssuer.mockReturnValue(true);
    mockedVerifyChallengeAndGetAddress.mockResolvedValue("0x0000000000000000000000000000000000000000");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("handles valid JWT authentication without challenge", async () => {
    const testAddress = "0x1234567890123456789012345678901234567890";

    // Mock JWT extraction and verification
    extractBearerToken.mockReturnValue("valid-jwt-token");
    verifyAndExtractAddress.mockReturnValue(testAddress.toLowerCase());

    const mockCredentials = [
      { credential: { type: ["VerifiableCredential"], credentialSubject: { provider: "provider-1" } } as any },
      { credential: { type: ["VerifiableCredential"], credentialSubject: { provider: "provider-2" } } as any },
    ];

    mockedVerifyProvidersAndIssueCredentials.mockResolvedValue({
      credentials: mockCredentials,
      timings: { platforms: {} },
    } as any);

    (axios.post as jest.Mock).mockResolvedValue({
      data: { score: mockScore },
    });

    const body = {
      payload: { ...mockPayload, address: testAddress },
      scorerId: "test-scorer",
      // No challenge - JWT auth only
    };

    const response = await request(app)
      .post("/embed/verify")
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .set("Authorization", "Bearer valid-jwt-token")
      .send(body)
      .expect(200);

    expect(response.body.score).toBeDefined();
    expect(response.body.credentials).toHaveLength(2);

    // Verify JWT functions were called
    expect(extractBearerToken).toHaveBeenCalledWith("Bearer valid-jwt-token");
    expect(verifyAndExtractAddress).toHaveBeenCalledWith("valid-jwt-token");

    // Verify challenge-based auth was NOT used
    expect(mockedVerifyChallengeAndGetAddress).not.toHaveBeenCalled();
  });

  it("falls back to challenge auth when JWT verification fails", async () => {
    const testAddress = "0x0000000000000000000000000000000000000000";

    // Mock JWT extraction but verification fails
    extractBearerToken.mockReturnValue("invalid-jwt-token");
    verifyAndExtractAddress.mockReturnValue(null); // JWT verification failed

    const mockCredentials = [
      { credential: { type: ["VerifiableCredential"], credentialSubject: { provider: "provider-1" } } as any },
    ];

    mockedVerifyProvidersAndIssueCredentials.mockResolvedValue({
      credentials: mockCredentials,
      timings: { platforms: {} },
    } as any);

    (axios.post as jest.Mock).mockResolvedValue({
      data: { score: mockScore },
    });

    const body = {
      challenge: mockChallenge,
      payload: mockPayload,
      scorerId: "test-scorer",
    };

    const response = await request(app)
      .post("/embed/verify")
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .set("Authorization", "Bearer invalid-jwt-token")
      .send(body)
      .expect(200);

    // Verify fallback to challenge auth
    expect(mockedVerifyChallengeAndGetAddress).toHaveBeenCalled();
    expect(response.body.score).toBeDefined();
  });

  it("returns 401 when no JWT and no challenge provided", async () => {
    // Mock no JWT present
    extractBearerToken.mockReturnValue(null);

    const body = {
      payload: mockPayload,
      scorerId: "test-scorer",
      // No challenge, no JWT
    };

    const response = await request(app)
      .post("/embed/verify")
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .send(body)
      .expect(401);

    expect(response.body.error).toContain("Missing challenge");
  });

  it("uses address from JWT token for credential issuance", async () => {
    const jwtAddress = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    const payloadAddress = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

    extractBearerToken.mockReturnValue("valid-jwt-token");
    verifyAndExtractAddress.mockReturnValue(jwtAddress.toLowerCase());

    const mockCredentials = [
      {
        credential: {
          type: ["VerifiableCredential"],
          credentialSubject: {
            provider: "provider-1",
            id: `did:pkh:eip155:1:${jwtAddress.toLowerCase()}`,
          },
        },
      } as any,
    ];

    mockedVerifyProvidersAndIssueCredentials.mockResolvedValue({
      credentials: mockCredentials,
      timings: { platforms: {} },
    } as any);

    (axios.post as jest.Mock).mockResolvedValue({
      data: { score: mockScore },
    });

    const body = {
      payload: { ...mockPayload, address: payloadAddress }, // Different from JWT
      scorerId: "test-scorer",
    };

    await request(app)
      .post("/embed/verify")
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .set("Authorization", "Bearer valid-jwt-token")
      .send(body)
      .expect(200);

    // Verify that verifyProvidersAndIssueCredentials was called with the JWT address
    expect(mockedVerifyProvidersAndIssueCredentials).toHaveBeenCalledWith(
      expect.any(Array),
      jwtAddress.toLowerCase(),
      expect.any(Object)
    );
  });

  it("handles credential errors with JWT auth", async () => {
    const testAddress = "0x1234567890123456789012345678901234567890";

    extractBearerToken.mockReturnValue("valid-jwt-token");
    verifyAndExtractAddress.mockReturnValue(testAddress.toLowerCase());

    const mockCredentialResponses = [
      { credential: { type: ["VerifiableCredential"], credentialSubject: { provider: "provider-1" } } as any },
      { error: "Verification failed", code: 403 },
    ];

    mockedVerifyProvidersAndIssueCredentials.mockResolvedValue({
      credentials: mockCredentialResponses,
      timings: { platforms: {} },
    } as any);

    (axios.post as jest.Mock).mockResolvedValue({
      data: { score: mockScore },
    });

    const body = {
      payload: { ...mockPayload, address: testAddress },
      scorerId: "test-scorer",
    };

    const response = await request(app)
      .post("/embed/verify")
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .set("Authorization", "Bearer valid-jwt-token")
      .send(body)
      .expect(200);

    expect(response.body.credentials).toHaveLength(1);
    expect(response.body.credentialErrors).toHaveLength(1);
    expect(response.body.credentialErrors[0]).toEqual({
      provider: "provider-2",
      error: "Verification failed",
      code: 403,
    });
  });
});
