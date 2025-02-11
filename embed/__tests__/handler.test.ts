import { jest, it, describe, expect, beforeEach } from "@jest/globals";

jest.unstable_mockModule("../src/utils/identityHelper.js", async () => {
  const originalModule = await import("@gitcoin/passport-identity");

  return {
    ...originalModule,
    autoVerifyStamps: jest.fn((autoVerificationFields: any): Promise<VerifiableCredential[]> => {
      return new Promise((resolve, reject) => {
        resolve([] as VerifiableCredential[]);
      });
    }),
  };
});

jest.unstable_mockModule("axios", () => {
  return {
    default: {
      post: jest.fn((autoVerificationFields: any): Promise<any> => {
        return new Promise((resolve, reject) => {
          resolve({
            data: { score: {} },
          });
        });
      }),
    },
  };
});

import { Response, Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { VerifiableCredential } from "@gitcoin/passport-types";
import { AutoVerificationRequestBodyType, AutoVerificationResponseBodyType } from "../src/handlers.types.js";

const { autoVerificationHandler } = await import("../src/handlers.js");
const { autoVerifyStamps } = await import("../src/utils/identityHelper.js");
const {
  default: { post },
} = await import("axios");
const axiosPost = post as jest.Mock;

const apiKey = process.env.SCORER_API_KEY;

beforeEach(() => {
  // Clear the spy stats
  jest.clearAllMocks();
});

describe("autoVerificationHandler", function () {
  it("properly calls autoVerifyStamps and addStampsAndGetScore", async () => {
    // as each signature is unique, each request results in unique output
    const request = {
      body: {
        address: "0x0000000000000000000000000000000000000000",
        scorerId: "123",
      },
    };

    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await autoVerificationHandler(
      request as Request<ParamsDictionary, AutoVerificationResponseBodyType, AutoVerificationRequestBodyType>,
      response as undefined as Response
    );

    expect(autoVerifyStamps).toHaveBeenCalledTimes(1);
    expect(autoVerifyStamps).toHaveBeenCalledWith({ ...request.body });

    expect(axiosPost).toHaveBeenCalledTimes(1);
    expect(axiosPost).toHaveBeenCalledWith(
      `${process.env.SCORER_ENDPOINT}/embed/stamps/0x0000000000000000000000000000000000000000`,
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
    const request = {
      body: {
        address: "0x0000000000000000000000000000000000000000",
        scorerId: "123",
        credentialIds: ["provider-1", "provider-2"],
      },
    };

    const response = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    await autoVerificationHandler(
      request as Request<ParamsDictionary, AutoVerificationResponseBodyType, AutoVerificationRequestBodyType>,
      response as undefined as Response
    );

    expect(autoVerifyStamps).toHaveBeenCalledTimes(1);
    expect(autoVerifyStamps).toHaveBeenCalledWith({ ...request.body });

    expect(axiosPost).toHaveBeenCalledTimes(1);
    expect(axiosPost).toHaveBeenCalledWith(
      `${process.env.SCORER_ENDPOINT}/embed/stamps/0x0000000000000000000000000000000000000000`,
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
