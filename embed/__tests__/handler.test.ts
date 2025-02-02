// ---- Testing libraries

import { Response, Request } from "express";
import axios, { type AxiosResponse } from "axios";
import {
  AutoVerificationResponseBodyType,
  AutoVerificationRequestBodyType,
  autoVerificationHandler,
} from "../src/handlers.js";
import { ParamsDictionary } from "express-serve-static-core";
import { autoVerifyStamps, AutoVerificationFields } from "@gitcoin/passport-identity";
import { VerifiableCredential } from "@gitcoin/passport-types";

const apiKey = process.env.SCORER_API_KEY;

jest.mock("@gitcoin/passport-identity", () => {
  const originalModule = jest.requireActual<typeof import("@gitcoin/passport-identity")>("@gitcoin/passport-identity");

  return {
    // __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    autoVerifyStamps: jest.fn((autoVerificationFields: AutoVerificationFields): Promise<VerifiableCredential[]> => {
      return new Promise((resolve, reject) => {
        resolve([] as VerifiableCredential[]);
      });
    }),
  };
});

jest.mock("axios", () => {
  const originalModule = jest.requireActual<typeof import("axios")>("axios");

  return {
    // __esModule: true, // Use it when dealing with esModules
    ...originalModule,
    post: jest.fn((autoVerificationFields: AutoVerificationFields): Promise<AxiosResponse> => {
      return new Promise((resolve, reject) => {
        resolve({
          data: { score: {} },
        } as AxiosResponse);
      });
    }),
  };
});

beforeEach(() => {
  // CLear the spy stats
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

    expect(axios.post as jest.Mock).toHaveBeenCalledTimes(1);
    expect(axios.post as jest.Mock).toHaveBeenCalledWith(
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

    expect(axios.post as jest.Mock).toHaveBeenCalledTimes(1);
    expect(axios.post as jest.Mock).toHaveBeenCalledWith(
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
