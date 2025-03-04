import { jest, it, describe, expect, beforeEach } from "@jest/globals";
import { Response, Request } from "express";
import { ParamsDictionary } from "express-serve-static-core";
import { autoVerificationHandler } from "../src/handlers.js";
import {
  AutoVerificationRequestBodyType,
  AutoVerificationResponseBodyType,
} from "../src/handlers.types.js";
import axios from "axios";
import { VerifiableCredential } from "@gitcoin/passport-types";
import { autoVerifyStamps } from "../src/utils/identityHelper.js";

const mockedAutoVerifyStamps = autoVerifyStamps as jest.MockedFunction<
  typeof autoVerifyStamps
>;

jest.mock("axios");

jest.mock("../src/utils/identityHelper");

const apiKey = process.env.SCORER_API_KEY;

describe("autoVerificationHandler", function () {
  beforeEach(() => {
    // Clear the spy stats
    jest.clearAllMocks();

    jest
      .spyOn(axios, "post")
      .mockImplementation((autoVerificationFields: any): Promise<any> => {
        return new Promise((resolve, reject) => {
          resolve({
            data: { score: {} },
          });
        });
      });

    mockedAutoVerifyStamps.mockImplementation(
      async (autoVerificationFields: any): Promise<VerifiableCredential[]> => {
        return new Promise((resolve, reject) => {
          resolve([] as VerifiableCredential[]);
        });
      },
    );
  });

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
      request as Request<
        ParamsDictionary,
        AutoVerificationResponseBodyType,
        AutoVerificationRequestBodyType
      >,
      response as unknown as Response,
    );

    expect(autoVerifyStamps).toHaveBeenCalledTimes(1);
    expect(autoVerifyStamps).toHaveBeenCalledWith({ ...request.body });

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
      },
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
      request as Request<
        ParamsDictionary,
        AutoVerificationResponseBodyType,
        AutoVerificationRequestBodyType
      >,
      response as unknown as Response,
    );

    expect(autoVerifyStamps).toHaveBeenCalledTimes(1);
    expect(autoVerifyStamps).toHaveBeenCalledWith({ ...request.body });

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
      },
    );
  });
});
