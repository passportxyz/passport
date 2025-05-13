// ---- Testing libraries
import { jest, it, describe, expect, beforeEach } from "@jest/globals";

import request from "supertest";
import { Response, Request } from "express";
import { AutoVerificationResponseBodyType, AutoVerificationRequestBodyType } from "../src/handlers.types.js";
import { ParamsDictionary } from "express-serve-static-core";
import { PassportScore } from "@gitcoin/passport-identity";

import { apiKeyRateLimit } from "../src/rateLimiter.js";
import { autoVerificationHandler, getScoreHandler } from "../src/handlers.js";
import { app } from "../src/server.js";

jest.mock("../src/rateLimiter", () => {
  return {
    apiKeyRateLimit: jest.fn((req, res) => {
      return new Promise((resolve, reject) => {
        resolve(10000);
      });
    }),
    // By returning `undefined` for getRateLimiterStore we expect this to use the default which is `memory-store`
    getRateLimiterStore: jest.fn(() => {
      return undefined;
    }),
  };
});

jest.mock("../src/handlers", () => {
  return {
    getChallengeHandler: jest.fn(),
    verificationHandler: jest.fn(),
    autoVerificationHandler: jest.fn(
      (
        req: Request<ParamsDictionary, AutoVerificationResponseBodyType, AutoVerificationRequestBodyType>,
        res: Response
      ): Promise<void> => {
        return new Promise((resolve, reject) => {
          res.status(200).json(mockedScore);
          resolve();
        });
      }
    ),
    getScoreHandler: jest.fn(
      (
        req: Request<ParamsDictionary, AutoVerificationResponseBodyType, AutoVerificationRequestBodyType>,
        res: Response
      ): Promise<void> => {
        return new Promise((resolve, reject) => {
          res.status(200).json(mockedScore);
          resolve();
        });
      }
    ),
  };
});

jest.mock("../src/redis", () => {
  return {
    redis: {
      call: async (...args: string[]): Promise<any> => Promise.resolve({}),
    },
  };
});

const mockedScore: PassportScore = {
  address: "0x0000000000000000000000000000000000000000",
  score: "12",
  passing_score: true,
  last_score_timestamp: new Date().toISOString(),
  expiration_timestamp: new Date().toISOString(),
  threshold: "20.000",
  error: "",
  stamps: {
    "provider-1": {
      score: "12",
      dedup: true,
      expiration_date: new Date().toISOString(),
    },
  },
};

beforeEach(() => {
  // CLear the spy stats
  jest.clearAllMocks();
});

describe("autoVerificationHandler", function () {
  it("handles valid verify requests", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      address: "0x0000000000000000000000000000000000000000",
      scorerId: "123",
    };

    // create a req against the express app
    const verifyRequest = await request(app)
      .post("/embed/auto-verify")
      .send(payload)
      .set("Accept", "application/json")
      .set("X-API-KEY", "MY.SECRET-KEY");

    expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(1);
    expect(autoVerificationHandler as jest.Mock).toHaveBeenCalledTimes(1);
    expect(verifyRequest.status).toBe(200);
    expect(verifyRequest.body).toStrictEqual(mockedScore);
  });

  it("handles invalid verify requests - missing api key", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      address: "0x0000000000000000000000000000000000000000",
      scorerId: "123",
    };

    // create a req against the express app
    const verifyRequest = await request(app).post("/embed/auto-verify").send(payload).set("Accept", "application/json");

    expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(0);
    expect(verifyRequest.status).toBe(401);
    expect(verifyRequest.body).toStrictEqual({
      error: "Unauthorized! No 'X-API-KEY' present in the header!",
      code: 401,
    });
  });

  it("handles invalid verify requests - api key validation fails", async () => {
    // as each signature is unique, each request results in unique output
    const payload = {
      address: "0x0000000000000000000000000000000000000000",
      scorerId: "123",
    };

    (apiKeyRateLimit as jest.Mock).mockImplementationOnce(() => {
      throw "Invalid API-KEY";
    });

    // create a req against the express app
    const verifyRequest = await request(app)
      .post("/embed/auto-verify")
      .send(payload)
      .set("Accept", "application/json")
      .set("X-API-KEY", "MY.SECRET-KEY");

    expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(1);
    expect(verifyRequest.status).toBe(500);
  });
});

describe("getScoreHandler", function () {
  it("handles valid verify requests", async () => {
    // create a req against the express app
    const verifyRequest = await request(app)
      .get("/embed/score/123/0x0")
      .set("Accept", "application/json")
      .set("X-API-KEY", "MY.SECRET-KEY");

    expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(1);
    expect(getScoreHandler as jest.Mock).toHaveBeenCalledTimes(1);
    expect(verifyRequest.status).toBe(200);
    expect(verifyRequest.body).toStrictEqual(mockedScore);
  });

  it("handles invalid verify requests - missing api key", async () => {
    // create a req against the express app
    const verifyRequest = await request(app).get("/embed/score/123/0x0").set("Accept", "application/json");

    expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(0);
    expect(verifyRequest.status).toBe(401);
    expect(verifyRequest.body).toStrictEqual({
      error: "Unauthorized! No 'X-API-KEY' present in the header!",
      code: 401,
    });
  });

  it("handles invalid verify requests - api key validation fails", async () => {
    (apiKeyRateLimit as jest.Mock).mockImplementationOnce(() => {
      throw "Invalid API-KEY";
    });

    // create a req against the express app
    const verifyRequest = await request(app)
      .get("/embed/score/123/0x0")
      .set("Accept", "application/json")
      .set("X-API-KEY", "MY.SECRET-KEY");

    expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(1);
    expect(verifyRequest.status).toBe(500);
  });
});

describe("POST /health", function () {
  it("handles valid health requests", async () => {
    // create a req against the express app
    const verifyRequest = await request(app).get("/health").set("Accept", "application/json");

    expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(0);
    expect(verifyRequest.status).toBe(200);
    expect(verifyRequest.body).toStrictEqual({
      message: "Ok",
    });
  });
});
