// ---- Test subject
import { gnosisSafeApiEndpoint, GnosisSafeProvider } from "../src/providers/gnosisSafe";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";

const validResponseList = ["safe-1", "safe-2", "safe-3"];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Verification succeeds", function () {
  it("when valid response is received from the gnosis safe API endpoint", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
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
    expect(mockedAxios.get).toBeCalledWith(`${gnosisSafeApiEndpoint}owners/${MOCK_ADDRESS}/safes`);

    expect(gnosisSafePayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS,
      },
    });
  });
});

describe("Verification fails", function () {
  it("when an empty list is received from the gnosis safe API", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
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
    expect(mockedAxios.get).toBeCalledWith(`${gnosisSafeApiEndpoint}owners/${MOCK_ADDRESS}/safes`);

    expect(gnosisSafePayload).toEqual({
      valid: false,
      error: ["Unable to find any safes owned by the given address"],
    });
  });

  it("when no list of safes is received from the gnosis safe API", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
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
    expect(mockedAxios.get).toBeCalledWith(`${gnosisSafeApiEndpoint}owners/${MOCK_ADDRESS}/safes`);

    expect(gnosisSafePayload).toEqual({
      valid: false,
      error: ["Unable to find any safes owned by the given address"],
    });
  });

  it("when the HTTP status code is not 200", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
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
    expect(mockedAxios.get).toBeCalledWith(`${gnosisSafeApiEndpoint}owners/${MOCK_ADDRESS}/safes`);

    expect(gnosisSafePayload).toEqual({
      valid: false,
      error: [`HTTP Error '400'. Details: 'Bad Request'.`],
    });
  });

  it("when the HTTP request throws", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      throw "something bad happened";
    });

    const gnosisSafeProvider = new GnosisSafeProvider();
    const gnosisSafePayload = await gnosisSafeProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the NFTs
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(`${gnosisSafeApiEndpoint}owners/${MOCK_ADDRESS}/safes`);

    expect(gnosisSafePayload).toEqual({
      valid: false,
      error: ["something bad happened"],
    });
  });
});
