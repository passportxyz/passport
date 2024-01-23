// TODO remove once tsconfig as unified across all packages
/* eslint-disable @typescript-eslint/unbound-method */
import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { ProviderExternalVerificationError } from "../../types";
import { ZkSyncEraProvider } from "../Providers/zkSyncEra";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLocaleLowerCase();
const BAD_ADDRESS = "0xsieh2863426gsaa";
process.env.ZKSYNC_ERA_MAINNET_ENDPOINT = "https://zksync-era-api-endpoint.io";

const validResponseItems = [
  {
    transactionHash: "0xsome_hash",
    from: MOCK_ADDRESS_LOWER,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    from: MOCK_ADDRESS_LOWER,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    from: MOCK_ADDRESS_LOWER,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    from: MOCK_ADDRESS_LOWER,
    status: "verified",
  },
];

const inValidResponseItemsAddressNotInFromField = [
  {
    transactionHash: "0xsome_hash",
    from: BAD_ADDRESS,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    from: BAD_ADDRESS,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    from: BAD_ADDRESS,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    from: BAD_ADDRESS,
    status: "verified",
  },
];

const inValidResponseItemsNoFinalizedTransaction = [
  {
    transactionHash: "0xsome_hash",
    from: MOCK_ADDRESS_LOWER,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    from: MOCK_ADDRESS_LOWER,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    from: MOCK_ADDRESS_LOWER,
    status: "included",
  },
  {
    transactionHash: "0xsome_hash",
    from: MOCK_ADDRESS_LOWER,
    status: "included",
  },
];

const env = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...env };
  jest.clearAllMocks();
});

afterEach(() => {
  process.env = env;
});

describe("Verification succeeds", function () {
  it("when valid response is received from the zksync API endpoint", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        status: 200,
        data: { items: validResponseItems },
      });
    });

    const zkSyncEraProvider = new ZkSyncEraProvider();
    const zkSyncEraPayload = await zkSyncEraProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the transactions
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${process.env.ZKSYNC_ERA_MAINNET_ENDPOINT}/transactions?address=${MOCK_ADDRESS_LOWER}&limit=100&direction=older`
    );

    expect(zkSyncEraPayload).toEqual({
      valid: true,
      errors: [],
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });
});

describe("Verification fails", function () {
  it("when the response items list does not contain any transaction initiated by the address we verify (address is not in from field)", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        status: 200,
        data: { items: inValidResponseItemsAddressNotInFromField },
      });
    });

    const zkSyncEraProvider = new ZkSyncEraProvider();
    const zkSyncEraPayload = await zkSyncEraProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the transactions
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${process.env.ZKSYNC_ERA_MAINNET_ENDPOINT}/transactions?address=${MOCK_ADDRESS_LOWER}&limit=100&direction=older`
    );

    expect(zkSyncEraPayload).toEqual({
      valid: false,
      errors: ["Unable to find a verified transaction from the given address"],
    });
  });

  it("when the response list does not contain any verified transactions", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        status: 200,
        data: { items: inValidResponseItemsNoFinalizedTransaction },
      });
    });

    const zkSyncEraProvider = new ZkSyncEraProvider();
    const zkSyncEraPayload = await zkSyncEraProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the transactions
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${process.env.ZKSYNC_ERA_MAINNET_ENDPOINT}/transactions?address=${MOCK_ADDRESS_LOWER}&limit=100&direction=older`
    );

    expect(zkSyncEraPayload).toEqual({
      valid: false,
      errors: ["Unable to find a verified transaction from the given address"],
    });
  });

  it("when the HTTP status code is not 200", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      return Promise.resolve({
        status: 400,
        statusText: "Bad Request",
        data: { items: validResponseItems },
      });
    });

    const zkSyncEraProvider = new ZkSyncEraProvider();
    const zkSyncEraPayload = await zkSyncEraProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    // Check the request to get the transactions
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${process.env.ZKSYNC_ERA_MAINNET_ENDPOINT}/transactions?address=${MOCK_ADDRESS_LOWER}&limit=100&direction=older`
    );

    expect(zkSyncEraPayload).toEqual({
      valid: false,
      record: undefined,
      errors: ["HTTP Error '400'. Details: 'Bad Request'."],
    });
  });

  it("when the HTTP request throws", async () => {
    (axios.get as jest.Mock).mockImplementation(() => {
      throw "something bad happened";
    });

    const zkSyncEraProvider = new ZkSyncEraProvider();

    await expect(async () => {
      return await zkSyncEraProvider.verify({
        address: MOCK_ADDRESS,
      } as unknown as RequestPayload);
    }).rejects.toThrow(
      new ProviderExternalVerificationError(
        // eslint-disable-next-line quotes
        'ZkSyncEra error was thrown while trying to verify transaction history. error: "something bad happened"'
      )
    );

    // Check the request to get the transactions
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `${process.env.ZKSYNC_ERA_MAINNET_ENDPOINT}/transactions?address=${MOCK_ADDRESS_LOWER}&limit=100&direction=older`
    );
  });
});
