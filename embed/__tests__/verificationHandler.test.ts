import { jest, it, describe, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import { app } from "../src/server.js";
import {
  verifyProvidersAndIssueCredentials,
  verifyCredential,
  hasValidIssuer,
  verifyChallengeAndGetAddress,
} from "../src/utils/identityHelper.js";
import axios from "axios";

jest.mock("axios");

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
  types: ["provider-1", "provider-2", "provider-3"],
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

describe("verificationHandler with error propagation", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (axios.get as jest.Mock).mockResolvedValueOnce({
      data: {
        embed_rate_limit: "125/15m",
      },
    });

    mockedVerifyCredential.mockResolvedValue(true);
    mockedHasValidIssuer.mockReturnValue(true);
    mockedVerifyChallengeAndGetAddress.mockResolvedValue("0x0000000000000000000000000000000000000000");
  });

  it("should include credentialErrors in response when some providers fail", async () => {
    const mockCredentialResponses = [
      { credential: { type: ["VerifiableCredential"], credentialSubject: { provider: "provider-1" } } as any },
      { error: "Verification failed", code: 403 },
      { error: "Provider error", code: 400 },
    ];

    mockedVerifyProvidersAndIssueCredentials.mockResolvedValue({
      credentials: mockCredentialResponses,
      timings: { platforms: {} },
    } as any);

    (axios.post as jest.Mock).mockResolvedValueOnce({
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
      .send(body)
      .expect(200);

    expect(response.body).toEqual({
      score: mockScore,
      credentials: [mockCredentialResponses[0].credential],
      credentialErrors: [
        { provider: "provider-2", error: "Verification failed", code: 403 },
        { provider: "provider-3", error: "Provider error", code: 400 },
      ],
    });

    expect(mockedVerifyProvidersAndIssueCredentials).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/internal/embed/stamps/"),
      expect.objectContaining({
        stamps: [mockCredentialResponses[0].credential],
        scorer_id: "test-scorer",
      }),
      expect.any(Object)
    );
  });

  it("should handle all providers failing", async () => {
    const mockCredentialResponses = [
      { error: "Provider 1 failed", code: 403 },
      { error: "Provider 2 failed", code: 400 },
    ];

    mockedVerifyProvidersAndIssueCredentials.mockResolvedValue({
      credentials: mockCredentialResponses,
      timings: { platforms: {} },
    } as any);

    (axios.post as jest.Mock).mockResolvedValueOnce({
      data: { score: { ...mockScore, score: "0" } },
    });

    const body = {
      challenge: mockChallenge,
      payload: { ...mockPayload, types: ["provider-1", "provider-2"] },
      scorerId: "test-scorer",
    };

    const response = await request(app)
      .post("/embed/verify")
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .send(body)
      .expect(200);

    expect(response.body).toEqual({
      score: { ...mockScore, score: "0" },
      credentials: [],
      credentialErrors: [
        { provider: "provider-1", error: "Provider 1 failed", code: 403 },
        { provider: "provider-2", error: "Provider 2 failed", code: 400 },
      ],
    });

    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining("/internal/embed/stamps/"),
      expect.objectContaining({
        stamps: [],
        scorer_id: "test-scorer",
      }),
      expect.any(Object)
    );
  });

  it("should handle all providers succeeding", async () => {
    const mockCredentials = [
      { type: ["VerifiableCredential"], credentialSubject: { provider: "provider-1" } },
      { type: ["VerifiableCredential"], credentialSubject: { provider: "provider-2" } },
    ];

    const mockCredentialResponses = mockCredentials.map((credential) => ({ credential }));

    mockedVerifyProvidersAndIssueCredentials.mockResolvedValue({
      credentials: mockCredentialResponses,
      timings: { platforms: {} },
    } as any);

    (axios.post as jest.Mock).mockResolvedValueOnce({
      data: { score: mockScore },
    });

    const body = {
      challenge: mockChallenge,
      payload: { ...mockPayload, types: ["provider-1", "provider-2"] },
      scorerId: "test-scorer",
    };

    const response = await request(app)
      .post("/embed/verify")
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .send(body)
      .expect(200);

    expect(response.body).toEqual({
      score: mockScore,
      credentials: mockCredentials,
      credentialErrors: [],
    });
  });

  it("should map credential responses to proper error format", async () => {
    const mockCredentialResponses = [
      { credential: { type: ["VerifiableCredential"], credentialSubject: { provider: "provider-1" } } as any },
      { error: "Complex error: something went wrong", code: 403 },
      { error: undefined, code: 500 }, // Test undefined error
      { credential: { type: ["VerifiableCredential"], credentialSubject: { provider: "provider-4" } } as any },
    ];

    mockedVerifyProvidersAndIssueCredentials.mockResolvedValue({
      credentials: mockCredentialResponses,
      timings: { platforms: {} },
    } as any);

    (axios.post as jest.Mock).mockResolvedValueOnce({
      data: { score: mockScore },
    });

    const body = {
      challenge: mockChallenge,
      payload: { ...mockPayload, types: ["provider-1", "provider-2", "provider-3", "provider-4"] },
      scorerId: "test-scorer",
    };

    const response = await request(app)
      .post("/embed/verify")
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .send(body)
      .expect(200);

    expect(response.body.credentialErrors).toEqual([
      { provider: "provider-2", error: "Complex error: something went wrong", code: 403 },
      { provider: "provider-3", error: "Verification failed", code: 500 },
    ]);
    expect(response.body.credentials).toHaveLength(2);
  });
});
