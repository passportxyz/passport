// ----- Types
import type { Provider, ProviderOptions } from "../../types";
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || process.env.NEXT_PUBLIC_ETHERSCAN_API_KEY;

interface EtherscanRequestResponseData {
  from?: string;
  gasUsed?: string;
  gasPrice?: string;
  isError?: string;
  timeStamp?: string;
}
// Define interfaces for the data structure returned by the request
interface EtherscanRequestResponse {
  status?: number;
  data?: {
    result?: EtherscanRequestResponseData[];
    status?: string;
    message?: string;
  };
}

interface EthGasCheck {
  hasGTEHalfEthSpentGas: boolean;
}

interface EthFirstTxnCheck {
  hasGTE30DaysSinceFirstTxn: boolean;
}

interface EthGTEOneTxnCheck {
  hasGTEOneEthTxn: boolean;
}

interface Error {
  response: {
    data: {
      message: string;
    };
  };
}

// Export an ETH provider that verifies a user has spent >= 0.5 ETH on gas fees
export class EthGasProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "EthGasProvider";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that the address that is passed in has accumulated >= 0.5 ETH on gas fees
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const address = payload.address.toLocaleLowerCase();
    const offsetCount = 500;
    let valid = false,
      ethTransactions: EtherscanRequestResponse["data"],
      ethInternalTransactions: EtherscanRequestResponse["data"],
      ethTokenTransactions: EtherscanRequestResponse["data"],
      verifiedPayload = {
        hasGTEHalfEthSpentGas: false,
      };

    try {
      ethTransactions = await fetchEthereumData("txlist", address, offsetCount);
      ethInternalTransactions = await fetchEthereumData("txlistinternal", address, offsetCount);
      ethTokenTransactions = await fetchEthereumData("tokentx", address, offsetCount);

      const combinedEthTransactions = ethTransactions.result
        .concat(ethInternalTransactions.result)
        .concat(ethTokenTransactions.result);

      verifiedPayload = checkGasFees(combinedEthTransactions);

      valid = address && verifiedPayload.hasGTEHalfEthSpentGas ? true : false;
    } catch (e) {
      return { valid: false };
    }

    return {
      valid: valid,
      record: valid
        ? {
            address: address,
            hasGTEHalfEthSpentGasSpentOnTheMainnet: String(valid),
          }
        : undefined,
    };
  }
}

// Export an ETH provider that verifies a user's first ETH transaction was >= 30 days ago
export class FirstEthTxnProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "FirstEthTxnProvider";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that the address that is passed in has gte 30 days since their
  // first ETH transaction on the mainnet
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const address = payload.address.toLocaleLowerCase();
    const offsetCount = 100;
    let valid = false,
      ethData: EtherscanRequestResponse["data"],
      verifiedPayload = {
        hasGTE30DaysSinceFirstTxn: false,
      };

    try {
      ethData = await fetchEthereumData("txlist", address, offsetCount);
      verifiedPayload = checkFirstTxn(ethData, address);

      valid = address && verifiedPayload.hasGTE30DaysSinceFirstTxn ? true : false;
    } catch (e) {
      return { valid: false };
    }

    return {
      valid: valid,
      record: valid
        ? {
            address: address,
            hasGTE30DaysSinceFirstTxnOnTheMainnet: String(valid),
          }
        : undefined,
    };
  }
}

// Export an ETH provider that verifies a user has at least one ETH transaction
export class EthGTEOneTxnProvider implements Provider {
  // Give the provider a type so that we can select it with a payload
  type = "EthGTEOneTxnProvider";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verify that the address that is passed in has made at least 1
  // ETH transaction on the mainnet
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const address = payload.address.toLocaleLowerCase();
    const offsetCount = 100;
    let valid = false,
      ethData: EtherscanRequestResponse["data"],
      verifiedPayload = {
        hasGTEOneEthTxn: false,
      };

    try {
      ethData = await fetchEthereumData("txlist", address, offsetCount);
      verifiedPayload = checkForTxns(ethData, address);

      valid = address && verifiedPayload.hasGTEOneEthTxn ? true : false;
    } catch (e) {
      return { valid: false };
    }

    return {
      valid: valid,
      record: valid
        ? {
            address: address,
            hasGTE1ETHTxnOnTheMainnet: String(valid),
          }
        : undefined,
    };
  }
}

const fetchEthereumData = async (
  action: string,
  address: string,
  offsetCount: number,
  singleRequest?: boolean
): Promise<EtherscanRequestResponse["data"]> => {
  const etherscanURL = (page: number) =>
    `https://api.etherscan.io/api?module=account&action=${action}&address=${address}&page=${page}&offset=${offsetCount}&sort=asc&apikey=${ETHERSCAN_API_KEY}`;

  let etherscanRequestResponse: EtherscanRequestResponse;
  let allResults: EtherscanRequestResponse["data"]["result"] = [];
  let pageNo = 1;

  while (pageNo < 3) {
    try {
      // GET request using Etherscan API to retrieve user's ethereum mainnet transactions
      etherscanRequestResponse = await axios.get(etherscanURL(pageNo));
    } catch (e: unknown) {
      const error = e as Error;
      throw `The GET request resulted in a status code ${etherscanRequestResponse.status} error. Message: ${error.response.data.message}`;
    }

    if (
      etherscanRequestResponse.data.status === "0" &&
      etherscanRequestResponse.data.message === "No transactions found"
    ) {
      break;
    }

    allResults = allResults.concat(etherscanRequestResponse.data.result);
    pageNo++;
    if (singleRequest) break;
  }

  return { ...etherscanRequestResponse.data, result: allResults };
};

const checkGasFees = (results: EtherscanRequestResponseData[]): EthGasCheck => {
  // set variables for gas fees calculations
  const weiLimit = BigInt(500000000000000000); // This is 0.5 ETH in wei

  let hasGTEHalfEthSpentGas = false;
  let totalWeiSpent = BigInt(0);

  // Iterate through result array and add up the gas used per transaction
  // until 0.5 ETH worth of gas is reached
  for (let i = 0; i < results.length; i++) {
    const gasUsed = BigInt(results[i].gasUsed);
    const gasPrice = BigInt(results[i].gasPrice);
    const weiSpent = gasUsed * gasPrice;
    totalWeiSpent += weiSpent;
    if (totalWeiSpent > weiLimit) {
      break;
    }
  }

  if (totalWeiSpent >= weiLimit) {
    hasGTEHalfEthSpentGas = true;
  }

  return {
    hasGTEHalfEthSpentGas,
  };
};

const checkFirstTxn = (ethData: EtherscanRequestResponse["data"], address: string): EthFirstTxnCheck => {
  // set variables for timestamp to days calculations
  let hasGTE30DaysSinceFirstTxn = false;
  const results = ethData.result;

  // Return the first successful transaction that was made >= 30 days ago by the wallet holder
  if (ethData.result.length > 0) {
    const successfulFirstTxn = results.findIndex((result) => {
      const txnInMilliseconds = parseInt(result.timeStamp) * 1000;
      const todayInMilliseconds = new Date().getTime();
      const timeDifference = todayInMilliseconds - txnInMilliseconds;
      const daysDifference = timeDifference / (1000 * 3600 * 24);

      return daysDifference >= 30 && result.isError === "0" && result.from.toLowerCase() === address;
    });

    successfulFirstTxn === -1 ? (hasGTE30DaysSinceFirstTxn = false) : (hasGTE30DaysSinceFirstTxn = true);
  }

  return {
    hasGTE30DaysSinceFirstTxn,
  };
};

const checkForTxns = (ethData: EtherscanRequestResponse["data"], address: string): EthGTEOneTxnCheck => {
  const results = ethData.result;
  let hasGTEOneEthTxn = false;
  // Iterate through the results array until the first instance where a
  // successful txn was made by the wallet holder
  if (results.length > 0) {
    const txnsCheck = results.findIndex((result) => result.isError === "0" && result.from.toLowerCase() === address);
    hasGTEOneEthTxn = txnsCheck === -1 ? false : true;
  }

  return {
    hasGTEOneEthTxn,
  };
};
