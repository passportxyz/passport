import { jest, it, describe, expect, beforeEach } from "@jest/globals";
import axios from "axios";
import { VerifiableCredential } from "@gitcoin/passport-types";
import { autoVerifyStamps } from "../src/utils/identityHelper.js";
import request from "supertest";
import { app } from "../src/server.js";

const mockedAutoVerifyStamps = autoVerifyStamps as jest.MockedFunction<typeof autoVerifyStamps>;

jest.mock("axios");

jest.mock("../src/utils/identityHelper", () => ({
  ...jest.requireActual<typeof import("../src/utils/identityHelper")>("../src/utils/identityHelper"),
  autoVerifyStamps: jest.fn(),
}));

const apiKey = process.env.SCORER_API_KEY;

const mockScore = { score: 0.5 };

describe("autoVerificationHandler", function () {
  beforeEach(() => {
    // Clear the spy stats
    jest.clearAllMocks();

    (axios.get as jest.Mock<() => Promise<{ data: { embed_rate_limit: string } }>>).mockResolvedValueOnce({
      data: {
        embed_rate_limit: "125/15m",
      },
    });

    jest.spyOn(axios, "post").mockImplementation((autoVerificationFields: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        resolve({
          data: { score: mockScore },
        });
      });
    });

    mockedAutoVerifyStamps.mockImplementation(async (autoVerificationFields: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        resolve({
          credentials: [] as VerifiableCredential[],
          credentialErrors: [],
        });
      });
    });
  });

  it("properly calls autoVerifyStamps and addStampsAndGetScore", async () => {
    // as each signature is unique, each request results in unique output
    const body = {
      address: "0x0000000000000000000000000000000000000000",
      scorerId: "123",
    };

    const response = await request(app)
      .post(`/embed/auto-verify`)
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .send(body)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      ...mockScore,
      credentialErrors: [],
    });

    expect(autoVerifyStamps).toHaveBeenCalledTimes(1);
    expect(autoVerifyStamps).toHaveBeenCalledWith(body);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      `${process.env.SCORER_ENDPOINT}/internal/embed/stamps/0x0000000000000000000000000000000000000000`,
      {
        stamps: expect.any(Array),
        scorer_id: "123",
      },
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );
  });

  it("properly calls autoVerifyStamps and addStampsAndGetScore when credentialIds are provided", async () => {
    // as each signature is unique, each request results in unique output
    const body = {
      address: "0x0000000000000000000000000000000000000000",
      scorerId: "123",
      credentialIds: ["provider-1", "provider-2"],
    };

    const response = await request(app)
      .post(`/embed/auto-verify`)
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .send(body)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      ...mockScore,
      credentialErrors: [],
    });

    expect(autoVerifyStamps).toHaveBeenCalledTimes(1);
    expect(autoVerifyStamps).toHaveBeenCalledWith(body);

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      `${process.env.SCORER_ENDPOINT}/internal/embed/stamps/0x0000000000000000000000000000000000000000`,
      {
        stamps: expect.any(Array),
        scorer_id: "123",
      },
      {
        headers: {
          Authorization: apiKey,
        },
      }
    );
  });

  it("should return credentialErrors when some verifications fail", async () => {
    const body = {
      address: "0x0000000000000000000000000000000000000000",
      scorerId: "123",
      credentialIds: ["provider-1", "provider-2", "provider-3"],
    };

    const mockCredentialErrors = [
      { provider: "provider-2", error: "Verification failed", code: 403 },
      { provider: "provider-3", error: "Provider error", code: 400 },
    ];

    mockedAutoVerifyStamps.mockImplementation(async () => ({
      credentials: [
        {
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          type: ["VerifiableCredential"],
          credentialSubject: { id: "test", provider: "provider-1" },
          issuer: "test",
          issuanceDate: new Date().toISOString(),
          expirationDate: new Date().toISOString(),
          proof: {} as any,
        },
      ],
      credentialErrors: mockCredentialErrors,
    }));

    const response = await request(app)
      .post(`/embed/auto-verify`)
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .send(body)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      ...mockScore,
      credentialErrors: mockCredentialErrors,
    });

    expect(autoVerifyStamps).toHaveBeenCalledTimes(1);
    expect(autoVerifyStamps).toHaveBeenCalledWith(body);
  });

  it("should handle when all verifications fail", async () => {
    const body = {
      address: "0x0000000000000000000000000000000000000000",
      scorerId: "123",
      credentialIds: ["provider-1", "provider-2"],
    };

    const mockCredentialErrors = [
      { provider: "provider-1", error: "Verification failed", code: 403 },
      { provider: "provider-2", error: "Provider error", code: 400 },
    ];

    mockedAutoVerifyStamps.mockImplementation(async () => ({
      credentials: [],
      credentialErrors: mockCredentialErrors,
    }));

    const response = await request(app)
      .post(`/embed/auto-verify`)
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .send(body)
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      ...mockScore,
      credentialErrors: mockCredentialErrors,
    });
  });
});
