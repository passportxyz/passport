/* eslint-disable */
// ---- Test subject
import { EthGasProvider, FirstEthTxnProvider, EthGTEOneTxnProvider } from "../Providers/ethTransactions";

// ----- Types
import { RequestPayload } from "@gitcoin/passport-types";
import { ProviderExternalVerificationError } from "../../types";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLocaleLowerCase();
const BAD_MOCK_ADDRESS = "F314CE817E25b4F784bC1f24c9A79A525fEC50f";
const BAD_MOCK_ADDRESS_LOWER = BAD_MOCK_ADDRESS.toLocaleLowerCase();

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;

const toUnixTime = () => {
  // returns today's date in unix time
  return Math.floor(new Date().getTime() / 1000);
};

const ETH_GAS_OFFSET_COUNT = 500;
const FIRST_ETH_GTE_TXN_OFFSET_COUNT = 100;

const noMoreTxResponse = {
  data: {
    data: {
      result: [] as [],
      status: "0",
      message: "No transactions found",
    },
    status: 200,
  },
};

const validEtherscanResponse = {
  data: {
    data: {
      result: [
        {
          from: `${MOCK_ADDRESS_LOWER}`,
          gasUsed: "100000000",
          gasPrice: "500000000",
          isError: "0",
          timeStamp: "1495266702",
        },
        {
          from: `${MOCK_ADDRESS_LOWER}`,
          gasUsed: "100000000",
          gasPrice: "500000000",
          isError: "0",
          timeStamp: "1526802702",
        },
        {
          from: `${MOCK_ADDRESS_LOWER}`,
          gasUsed: "100000000",
          gasPrice: "500000000",
          isError: "0",
          timeStamp: "1555266702",
        },
        {
          from: `${MOCK_ADDRESS_LOWER}`,
          gasUsed: "100000000",
          gasPrice: "500000000",
          isError: "0",
          timeStamp: "1595266702",
        },
        {
          from: `${MOCK_ADDRESS_LOWER}`,
          gasUsed: "100000000",
          gasPrice: "500000000",
          isError: "0",
          timeStamp: "1658303502",
        },
        {
          from: `${MOCK_ADDRESS_LOWER}`,
          gasUsed: "100000000",
          gasPrice: "500000000",
          isError: "0",
          timeStamp: "1655711502",
        },
      ],
    },
    status: 200,
  },
};

const invalidEtherscanResponseLTHalfEthGasSpent = {
  data: {
    data: {
      result: [
        {
          from: `${MOCK_ADDRESS_LOWER}`,
          gasUsed: "200000000",
          isError: "0",
          timeStamp: "1658303502",
        },
        {
          from: `${MOCK_ADDRESS_LOWER}`,
          gasUsed: "100000000",
          isError: "0",
          timeStamp: "1655711502",
        },
      ],
    },
    status: 200,
  },
};

const invalidEtherscanResponseNoSuccessfulTxns = {
  data: {
    data: {
      result: [
        {
          from: `${MOCK_ADDRESS_LOWER}`,
          gasUsed: "200000000",
          isError: "1",
          timeStamp: toUnixTime().toString(),
        },
        {
          from: `${MOCK_ADDRESS_LOWER}`,
          gasUsed: "200000000",
          isError: "1",
          timeStamp: (toUnixTime() + 3000000).toString(),
        },
        {
          from: `${MOCK_ADDRESS_LOWER}`,
          gasUsed: "200000000",
          isError: "1",
          timeStamp: toUnixTime().toString(),
        },
      ],
    },
    status: 200,
  },
};

const invalidRequest = {
  data: {
    error: {
      response: {
        message: "Bad request",
      },
    },
    status: 500,
  },
};

const mockNRequests = (pageCount: number, mockSuccessResponse: any, address: string = MOCK_ADDRESS_LOWER) =>
  mockedAxios.get.mockImplementation(async (url) => {
    if (url.includes("https://api.etherscan.io/api") && url.includes(address)) {
      for (let i = 1; i <= pageCount; i++) {
        if (url.includes(`&page=${i}`)) {
          return i < pageCount ? Promise.resolve(mockSuccessResponse.data) : Promise.resolve(noMoreTxResponse.data);
        }
      }
    }
  });

describe("Attempt verification for ETH gas provider stamp", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid verification attempt", async () => {
    mockNRequests(2, validEtherscanResponse);

    const ethGasProvider = new EthGasProvider();
    const verifiedPayload = await ethGasProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(6);
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${MOCK_ADDRESS_LOWER}&page=1&offset=${ETH_GAS_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlistinternal&address=${MOCK_ADDRESS_LOWER}&page=1&offset=${ETH_GAS_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: `${MOCK_ADDRESS_LOWER}`,
        hasGTEHalfEthSpentGasSpentOnTheMainnet: "true",
      },
      errors: [],
    });
  });

  it("should return invalid payload if the user has accumulated less than 0.5 ETH in gas fees", async () => {
    mockNRequests(1, invalidEtherscanResponseLTHalfEthGasSpent);

    const ethGasProvider = new EthGasProvider();
    const verifiedPayload = await ethGasProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${MOCK_ADDRESS_LOWER}&page=1&offset=${ETH_GAS_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlistinternal&address=${MOCK_ADDRESS_LOWER}&page=1&offset=${ETH_GAS_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );

    expect(verifiedPayload).toMatchObject({
      valid: false,
      record: undefined,
      errors: [
        "The total amount you've spent on gas on Ethereum Mainnet is: 0, which is below the requirement of 0.5 ETH or 500000000000000000 Wei.",
      ],
    });
  });

  it("should return invalid payload when the user has no ethereum transactions (empty result array)", async () => {
    mockNRequests(1, noMoreTxResponse);

    const ethGasProvider = new EthGasProvider();
    const verifiedPayload = await ethGasProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(3);
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${MOCK_ADDRESS_LOWER}&page=1&offset=${ETH_GAS_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlistinternal&address=${MOCK_ADDRESS_LOWER}&page=1&offset=${ETH_GAS_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );

    expect(verifiedPayload).toMatchObject({
      valid: false,
      record: undefined,
      errors: [
        "The total amount you've spent on gas on Ethereum Mainnet is: 0, which is below the requirement of 0.5 ETH or 500000000000000000 Wei.",
      ],
    });
  });

  it("should return invalid payload if there is no address provided to the ETH gas provider verification method", async () => {
    mockNRequests(2, validEtherscanResponse, "");

    const ethGasProvider = new EthGasProvider();

    await expect(async () => {
      await ethGasProvider.verify({
        address: "",
      } as unknown as RequestPayload);
    }).rejects.toThrow(new ProviderExternalVerificationError("Bad address"));
  });

  it("should throw Provider External Verification error when an exception is thrown when a request is made", async () => {
    mockedAxios.get.mockImplementation(async (url: any) => {
      if (url.includes("https://api.etherscan.io/api") && url.includes(BAD_MOCK_ADDRESS_LOWER)) {
        throw "an error";
      }
    });

    const ethGasProvider = new EthGasProvider();

    expect(async () => {
      await ethGasProvider.verify({
        address: BAD_MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload);
    }).rejects.toThrow(
      new ProviderExternalVerificationError(
        "More than 0.5 in gas fees on Ethereum check error: an error."
      )
    );
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${BAD_MOCK_ADDRESS_LOWER}&page=1&offset=${ETH_GAS_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );
  });
});

describe("Attempt verification for gte 30 days since first ETH transaction stamp", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid verification attempt", async () => {
    mockNRequests(2, validEtherscanResponse);

    const firstEthTxnProvider = new FirstEthTxnProvider();
    const verifiedPayload = await firstEthTxnProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${MOCK_ADDRESS_LOWER}&page=1&offset=${FIRST_ETH_GTE_TXN_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: `${MOCK_ADDRESS_LOWER}`,
        hasGTE30DaysSinceFirstTxnOnTheMainnet: "true",
      },
      errors: [],
    });
  });

  it("should return invalid payload when it's been less than 30 days since the user's first ETH transaction", async () => {
    mockNRequests(1, invalidEtherscanResponseLTHalfEthGasSpent);

    const firstEthTxnProvider = new FirstEthTxnProvider();
    const verifiedPayload = await firstEthTxnProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${MOCK_ADDRESS_LOWER}&page=1&offset=${FIRST_ETH_GTE_TXN_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );

    expect(verifiedPayload).toMatchObject({
      valid: false,
      record: undefined,
      errors: ["Your first transaction on Ethereum Mainnet was: 0 days ago, which is below the requirement of 30 days."],
    });
  });

  it("should return invalid payload when the user has no ethereum transactions (empty result array)", async () => {
    mockNRequests(1, noMoreTxResponse);

    const firstEthTxnProvider = new FirstEthTxnProvider();
    const verifiedPayload = await firstEthTxnProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${MOCK_ADDRESS_LOWER}&page=1&offset=${FIRST_ETH_GTE_TXN_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );

    expect(verifiedPayload).toMatchObject({
      valid: false,
      record: undefined,
      errors: ["Your first transaction on Ethereum Mainnet was: 0 days ago, which is below the requirement of 30 days."],
    });
  });

  it("should throw Provider External Verification error if there is no address provided to the ETH gas provider verification method", async () => {
    mockedAxios.get.mockImplementation(async (url) => {
      if (url.includes("https://api.etherscan.io/api")) {
        return Promise.resolve(invalidRequest.data);
      }
    });
    const firstEthTxnProvider = new FirstEthTxnProvider();
    expect(async () => {
      await firstEthTxnProvider.verify({
        address: "",
      } as unknown as RequestPayload);
    }).rejects.toThrow(
      new ProviderExternalVerificationError(
        "Thirty days or more since first transaction on Ethereum check error: TypeError: Cannot read properties of undefined (reading 'status')."
      )
    );
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlist&address=&page=1&offset=${FIRST_ETH_GTE_TXN_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );
  });

  it("should throw Provider External Verification error when an exception is thrown when a request is made", async () => {
    mockedAxios.get.mockImplementation(async (url) => {
      if (url.includes("https://api.etherscan.io/api") && url.includes(BAD_MOCK_ADDRESS_LOWER)) {
        throw "an error";
      }
    });

    const firstEthTxnProvider = new FirstEthTxnProvider();

    expect(async () => {
      return await firstEthTxnProvider.verify({
        address: BAD_MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload);
    }).rejects.toThrow(
      new ProviderExternalVerificationError(
        "Thirty days or more since first transaction on Ethereum check error: an error."
      )
    );
    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${BAD_MOCK_ADDRESS_LOWER}&page=1&offset=${FIRST_ETH_GTE_TXN_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );
  });
});

describe("Attempt verification for at least one ETH transaction on the mainnet stamp", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("handles valid verification attempt", async () => {
    mockNRequests(2, validEtherscanResponse, MOCK_ADDRESS_LOWER);

    const ethGTEOneTxnProvider = new EthGTEOneTxnProvider();
    const verifiedPayload = await ethGTEOneTxnProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(2);
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${MOCK_ADDRESS_LOWER}&page=1&offset=${FIRST_ETH_GTE_TXN_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: `${MOCK_ADDRESS_LOWER}`,
        hasGTE1ETHTxnOnTheMainnet: "true",
      },
      errors: [],
    });
  });

  it("should return invalid payload when the user has no successful ethereum transactions", async () => {
    mockNRequests(1, invalidEtherscanResponseNoSuccessfulTxns);

    const ethGTEOneTxnProvider = new EthGTEOneTxnProvider();
    const verifiedPayload = await ethGTEOneTxnProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${MOCK_ADDRESS_LOWER}&page=1&offset=${FIRST_ETH_GTE_TXN_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );

    expect(verifiedPayload).toMatchObject({
      valid: false,
      record: undefined,
      errors: ["You currently do not have 1 or more transactions on Ethereum Mainnet"],
    });
  });

  it("should return invalid payload when the user has no ethereum transactions (empty result array)", async () => {
    mockNRequests(1, noMoreTxResponse);

    const ethGTEOneTxnProvider = new EthGTEOneTxnProvider();
    const verifiedPayload = await ethGTEOneTxnProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${MOCK_ADDRESS_LOWER}&page=1&offset=${FIRST_ETH_GTE_TXN_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );

    expect(verifiedPayload).toMatchObject({
      valid: false,
      record: undefined,
      errors: ["You currently do not have 1 or more transactions on Ethereum Mainnet"],
    });
  });

  it("should return invalid payload if there is no address provided to the ETH gas provider verification method", async () => {
    mockedAxios.get.mockImplementation(async (url) => {
      if (url.includes("https://api.etherscan.io/api") && url.includes(MOCK_ADDRESS_LOWER)) {
        return Promise.resolve(invalidRequest.data);
      }
    });

    const ethGTEOneTxnProvider = new EthGTEOneTxnProvider();

    expect(async () => {
      await ethGTEOneTxnProvider.verify({
        address: "",
      } as unknown as RequestPayload);
    }).rejects.toThrow(
      new ProviderExternalVerificationError(
        "One or more Ethereum transactions check error: TypeError: Cannot read properties of undefined (reading 'data')."
      )
    );

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlist&address=&page=1&offset=${FIRST_ETH_GTE_TXN_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );
  });

  it("should throw Provider External Verification error when a request throws an error", async () => {
    mockedAxios.get.mockImplementation(async (url) => {
      if (url.includes("https://api.etherscan.io/api") && url.includes(MOCK_ADDRESS_LOWER)) {
        return Promise.resolve(invalidRequest.data?.error);
      }
    });

    const ethGTEOneTxnProvider = new EthGTEOneTxnProvider();

    expect(async () => {
      return await ethGTEOneTxnProvider.verify({
        address: BAD_MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload);
    }).rejects.toThrow(
      new ProviderExternalVerificationError(
        "One or more Ethereum transactions check error: TypeError: Cannot read properties of undefined (reading 'data')."
      )
    );

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(mockedAxios.get).toBeCalledWith(
      `https://api.etherscan.io/api?module=account&action=txlist&address=${BAD_MOCK_ADDRESS_LOWER}&page=1&offset=${FIRST_ETH_GTE_TXN_OFFSET_COUNT}&sort=asc&apikey=${ETHERSCAN_API_KEY}`
    );
  });
});
