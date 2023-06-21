// TODO remove once tsconfig as unified across all packages
/* eslint-disable @typescript-eslint/unbound-method */
import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { zkSyncEraApiEndpoint, ZkSyncEraProvider } from "../Providers/zkSyncEra";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLocaleLowerCase();
const BAD_ADDRESS = "0xsieh2863426gsaa";

const validResponseList = [
  {
    transactionHash: "0xsome_hash",
    initiatorAddress: MOCK_ADDRESS_LOWER,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    initiatorAddress: MOCK_ADDRESS_LOWER,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    initiatorAddress: MOCK_ADDRESS_LOWER,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    initiatorAddress: MOCK_ADDRESS_LOWER,
    status: "verified",
  },
];

const inValidResponseListAddressNotInFromField = [
  {
    transactionHash: "0xsome_hash",
    initiatorAddress: BAD_ADDRESS,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    initiatorAddress: BAD_ADDRESS,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    initiatorAddress: BAD_ADDRESS,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    initiatorAddress: BAD_ADDRESS,
    status: "verified",
  },
];

const inValidResponseListNoFinalizedTransaction = [
  {
    transactionHash: "0xsome_hash",
    initiatorAddress: MOCK_ADDRESS_LOWER,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    initiatorAddress: MOCK_ADDRESS_LOWER,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    initiatorAddress: MOCK_ADDRESS_LOWER,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    initiatorAddress: MOCK_ADDRESS_LOWER,
    status: "included",
  },
];

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Verification succeeds", function () {
  it("when valid response is received from the zksync API endpoint", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        status: 200,
        data: { list: validResponseList },
      });
    });

    const zkSyncEraProvider = new ZkSyncEraProvider();
    const zkSyncEraPayload = await zkSyncEraProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the transactions
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(`${zkSyncEraApiEndpoint}transactions`, {
      params: {
        limit: 100,
        direction: "older",
        accountAddress: MOCK_ADDRESS_LOWER,
      },
    });

    expect(zkSyncEraPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });
});

describe("Verification fails", function () {
  it("when the response list does not contain any transaction initiated by the address we verify (address is not in from field)", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        status: 200,
        data: { list: inValidResponseListAddressNotInFromField },
      });
    });

    const zkSyncEraProvider = new ZkSyncEraProvider();
    const zkSyncEraPayload = await zkSyncEraProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the transactions
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(`${zkSyncEraApiEndpoint}transactions`, {
      params: {
        limit: 100,
        direction: "older",
        accountAddress: MOCK_ADDRESS_LOWER,
      },
    });

    expect(zkSyncEraPayload).toEqual({
      valid: false,
      error: ["Unable to find a verified transaction from the given address"],
    });
  });

  it("when the response list does not contain any verified transactions", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        status: 200,
        data: { list: inValidResponseListNoFinalizedTransaction },
      });
    });

    const zkSyncEraProvider = new ZkSyncEraProvider();
    const zkSyncEraPayload = await zkSyncEraProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the transactions
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(`${zkSyncEraApiEndpoint}transactions`, {
      params: {
        limit: 100,
        direction: "older",
        accountAddress: MOCK_ADDRESS_LOWER,
      },
    });

    expect(zkSyncEraPayload).toEqual({
      valid: false,
      error: ["Unable to find a verified transaction from the given address"],
    });
  });

  it("when the HTTP status code is not 200", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        status: 400,
        statusText: "Bad Request",
        data: { list: validResponseList },
      });
    });

    const zkSyncEraProvider = new ZkSyncEraProvider();
    const zkSyncEraPayload = await zkSyncEraProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the transactions
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(`${zkSyncEraApiEndpoint}transactions`, {
      params: {
        limit: 100,
        direction: "older",
        accountAddress: MOCK_ADDRESS_LOWER,
      },
    });

    expect(zkSyncEraPayload).toEqual({
      valid: false,
      error: ["HTTP Error '400'. Details: 'Bad Request'."],
    });
  });

  it("when the HTTP request throws", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      throw "something bad happened";
    });

    const zkSyncEraProvider = new ZkSyncEraProvider();
    const zkSyncEraPayload = await zkSyncEraProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the transactions
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(`${zkSyncEraApiEndpoint}transactions`, {
      params: {
        limit: 100,
        direction: "older",
        accountAddress: MOCK_ADDRESS_LOWER,
      },
    });

    expect(zkSyncEraPayload).toEqual({
      valid: false,
      error: ["Error getting transaction list for address"],
    });
  });
});
