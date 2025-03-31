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

    (axios.get as jest.Mock<() => Promise<{ data: { rate_limit: string } }>>).mockResolvedValueOnce({
      data: {
        rate_limit: "125/15m",
      },
    });

    jest.spyOn(axios, "post").mockImplementation((autoVerificationFields: any): Promise<any> => {
      return new Promise((resolve, reject) => {
        resolve({
          data: { score: mockScore },
        });
      });
    });

    mockedAutoVerifyStamps.mockImplementation(async (autoVerificationFields: any): Promise<VerifiableCredential[]> => {
      return new Promise((resolve, reject) => {
        resolve([] as VerifiableCredential[]);
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

    expect(response.body).toEqual(mockScore);

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

    expect(response.body).toEqual(mockScore);

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
});
