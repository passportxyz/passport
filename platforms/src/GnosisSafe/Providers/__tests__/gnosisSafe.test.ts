/* eslint-disable */
// ---- Test subject
import { gnosisSafeApiEndpoint, GnosisSafeProvider } from "../gnosisSafe.js";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { ProviderExternalVerificationError } from "../../../types.js";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MOCK_ADDRESS = "0xEf1c6E67703c7BD7107eed8303Fbe6EC2554BF6B";

const validResponseList = ["safe-1", "safe-2", "safe-3"];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Verification succeeds", function () {
  it("when valid response is received from the gnosis safe API endpoint", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        status: 200,
        data: {
          safes: validResponseList,
        },
      });
    });

    const gnosisSafeProvider = new GnosisSafeProvider();
    const gnosisSafePayload = await gnosisSafeProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the NFTs
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(`${gnosisSafeApiEndpoint}owners/${MOCK_ADDRESS}/safes/`);

    expect(gnosisSafePayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS,
      },
      errors: [],
    });
  });
});

describe("Verification fails", function () {
  it("when an empty list is received from the gnosis safe API", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        status: 200,
        data: {
          safes: [],
        },
      });
    });

    const gnosisSafeProvider = new GnosisSafeProvider();
    const gnosisSafePayload = await gnosisSafeProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the NFTs
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(`${gnosisSafeApiEndpoint}owners/${MOCK_ADDRESS}/safes/`);

    expect(gnosisSafePayload).toEqual({
      valid: false,
      errors: ["Unable to find any safes owned by the given address"],
      record: undefined,
    });
  });

  it("when no list of safes is received from the gnosis safe API", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        status: 200,
        data: {},
      });
    });

    const gnosisSafeProvider = new GnosisSafeProvider();
    const gnosisSafePayload = await gnosisSafeProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the NFTs
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(`${gnosisSafeApiEndpoint}owners/${MOCK_ADDRESS}/safes/`);

    expect(gnosisSafePayload).toEqual({
      valid: false,
      errors: ["Unable to find any safes owned by the given address"],
      record: undefined,
    });
  });

  it("when the HTTP status code is not 200", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        status: 400,
        statusText: "Bad Request",
        data: {
          result: { list: validResponseList },
          status: "success",
        },
      });
    });

    const gnosisSafeProvider = new GnosisSafeProvider();
    const gnosisSafePayload = await gnosisSafeProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the NFTs
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(`${gnosisSafeApiEndpoint}owners/${MOCK_ADDRESS}/safes/`);

    expect(gnosisSafePayload).toEqual({
      valid: false,
      errors: [`HTTP Error '400'. Details: 'Bad Request'.`],
      record: undefined,
    });
  });

  it("when the HTTP request throws", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      throw "something bad happened";
    });

    const gnosisSafeProvider = new GnosisSafeProvider();
    const gnosisSafePayload = await gnosisSafeProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the NFTs
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(`${gnosisSafeApiEndpoint}owners/${MOCK_ADDRESS}/safes/`);

    expect(gnosisSafePayload).toEqual({
      valid: false,
      errors: ["something bad happened"],
      record: undefined,
    });
  });

  it("should throw Provider External Verification error with empty address string", async () => {
    const gnosisSafeProvider = new GnosisSafeProvider();
    // Check the request to get the safes
    await expect(async () => {
      return await gnosisSafeProvider.verify({
        address: "",
      } as unknown as RequestPayload);
    }).rejects.toThrow(
      new ProviderExternalVerificationError(
        `Error verifying Gnosis Safes: {"code":"INVALID_ARGUMENT","argument":"address","value":"","shortMessage":"invalid address"}`
      )
    );
    expect(axios.get).toHaveBeenCalledTimes(0);
  });
});
