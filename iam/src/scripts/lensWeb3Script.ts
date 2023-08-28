import * as dotenv from "dotenv";
import { writeFile as _writeFile } from "fs";
import * as fs from "fs";
import { Stamp } from "@gitcoin/passport-types";
import { RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import csv from "csv-parser";
import { BigNumber } from "ethers";
import {
  UserStakes,
  Output,
  GITCOIN_PASSPORT_WEIGHTS,
  web3Payloads,
  hexToDecimal,
  Checkpoint,
} from "./utils";
import { AxiosError } from "axios";

dotenv.config({ path: "../../.env" });

import { verifyTypes } from "../index";

async function retryWithBackoff(fn: Function, retries: number = 3, interval: number = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error?.response?.status === 429 && i < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, interval));
        interval *= 2;
      } else {
        throw error;
      }
    }
  }
}

function logSize(direction: string, data: unknown) {
  if (data) {
    const sizeInBytes = Buffer.from(JSON.stringify(data)).length;
    const sizeInKilobytes = (sizeInBytes / 1024).toFixed(2);
    console.log(`Size of ${direction} payload: ${sizeInKilobytes} KB`);
  }
}

axios.interceptors.request.use(config => {
  logSize("request", config.data);
  return config;
}, error => {
  return Promise.reject(error);
});

axios.interceptors.response.use(response => {
  logSize("response", response.data);
  return response;
}, error => {
  return Promise.reject(error);
});

const SCORER_ID = process.env.ALLO_SCORER_ID || "";

const API_KEY = process.env.SCORER_API_KEY || "";

const GET_PASSPORT_ENDPOINT = process.env.SCORER_ENDPOINT + "/registry/stamps/";

const SCORE_PASSPORT_ENDPOINT = process.env.SCORER_ENDPOINT + "/registry/submit-passport";

const stakingSubgraph = `https://gateway.thegraph.com/api/${process.env.GTC_STAKING_GRAPH_API_KEY}/subgraphs/id/6neBRm8wdXfbH9WQuFeizJRpsom4qovuqKhswPBRTC5Q`;

export const headerOptions = {
  headers: {
    "X-API-Key": API_KEY,
    "Content-Type": "application/json",
  }
}

function getStakeQuery(address: string): string {
  return `
  {
    users(where: {address: "${address}"}) {
      stakes {
        stake
      }
      xstakeAggregates(where: {total_gt: 0}) {
        total
      }
    }
  }
  `;
}

const check = async (payload: RequestPayload): Promise<{ valid: boolean; type: string; }[]> => {
  // types filters out the types into an individual type
  const types = (payload.types?.length ? payload.types : [payload.type]).filter((type) => type);
  try {
    // verifyTypes returns whether the type is valid
    const web3Results = await verifyTypes(types, payload);
    const responses = web3Results
      .filter((result) => result.verifyResult.valid)
      .map((result) => ({ valid: result.verifyResult.valid, type: result.type }));
    return responses;
  } catch (error) {
    throw new Error("Something went wrong with the web3 checks")
  }
};

const handleCheckForWeb3Stamps = async (address: string): Promise<{ valid: boolean; type: string; }[]> => {
  try {
    const web3Promises = web3Payloads.map(async (payload) => {
      const updatedPayload = { ...payload, address: address };
      return await check(updatedPayload);
    });
    const results = await Promise.all(web3Promises);
    return results.flat();
  } catch (e) {
    console.error(e)
  }
}

async function doesAddressHavePassport(address: string): Promise<boolean> {
  const response = await retryWithBackoff(() => axios.get(`${GET_PASSPORT_ENDPOINT}${address}?limit=5`, headerOptions));
  const addressInRegistry = response.data.items.length > 0 ? true : false;

  return addressInRegistry;
}

async function getStamps(address: string): Promise<Stamp[]> {
  try {
    const response = await retryWithBackoff(() => axios.get(`${GET_PASSPORT_ENDPOINT}${address}?limit=1000`, headerOptions));
    const data: Stamp[] = response.data.items;
    return data;
  } catch (e) {
    throw new Error(e.message) as AxiosError;
  }
}

async function checkGTCStaked(address: string): Promise<UserStakes> {
  try {
    const response = await retryWithBackoff(() => axios.post(stakingSubgraph, {
      query: getStakeQuery(address),
    }));

    const selfStake = BigNumber.from(response?.data?.data?.users[0]?.stakes[0]?.stake || "0");
    const communityStake = BigNumber.from(response?.data?.data?.users[0]?.xstakeAggregates[0]?.total || "0");
    return { selfStake, communityStake };
  } catch (e) {
    throw new Error() as AxiosError;
  }
}

async function scorePassport(address: string): Promise<number> {
  const data = {
    address: address,
    scorer_id: SCORER_ID,
    signature: "",
    nonce: "",
  };

  try {
    const response = await retryWithBackoff(() => axios.post(SCORE_PASSPORT_ENDPOINT, data, headerOptions));

    return response.data.score;
  } catch (e) {
    throw new Error(e.message) as AxiosError;
  }
}

async function scoreWeb3Stamps(address: string, data: { valid: boolean; type: string; }[], addressHasPassport: boolean): Promise<number> {
  // do a check if the web3 stamps are already in their passport. If not, score them
  if (addressHasPassport) {
    // const passportWeb3Providers: string[] = [];
    const stamps = await getStamps(address);
    const providers = new Set(stamps.map(stamp => stamp.credential.credentialSubject.provider));

    // this needs to check against the check() result
    const checkedWeb3Providers = await handleCheckForWeb3Stamps(address)
    const passportWeb3Providers = (checkedWeb3Providers)
      .filter((web3Provider: { valid: boolean; type: string; }) => !providers.has(web3Provider.type))
      .map(web3Provider => web3Provider.type);

    const score = GITCOIN_PASSPORT_WEIGHTS.reduce((accumulator, item) => {
      for (let web3Provider of passportWeb3Providers) {
        if (web3Provider === item.name) {
          const itemScore = parseFloat(item.score);
          return accumulator + itemScore;
        }
      }
      return accumulator;
    }, 0);

    return score;
  } else {
    const result = GITCOIN_PASSPORT_WEIGHTS.reduce((acc, item) => {
      const score = data.reduce((innerAcc, web3Item) => {
        if (web3Item && web3Item.type === item.name && web3Item.valid === true) {
          return innerAcc + parseFloat(item.score);
        }
        return innerAcc;
      }, 0);
      return acc + score;
    }, 0);

    return result;
  }
};

async function main(address: string): Promise<Output> {
  try {
    let output: Output;
    const currentAddressHasPassport = await doesAddressHavePassport(address);
    const { selfStake, communityStake } = await checkGTCStaked(address);
    const gtcStakedBigN = hexToDecimal(selfStake) + hexToDecimal(communityStake);
    const gtcStaked = Number(gtcStakedBigN)

    const addressLower = address.toLowerCase();

    if (currentAddressHasPassport) {
      const score = await scorePassport(addressLower);
      const web3Score = await scoreWeb3Stamps(addressLower, [], currentAddressHasPassport);
      const totalScore = Number(score) + Number(web3Score);

      output = {
        ScoreType: "Passport",
        Score: totalScore,
        GTCStaked: gtcStaked,
        AdditionalCriteria: {}
      };
    } else {
      const results = await handleCheckForWeb3Stamps(addressLower);
      const score = scoreWeb3Stamps(addressLower, results, currentAddressHasPassport);

      output = {
        ScoreType: "Web3",
        Score: await score,
        GTCStaked: gtcStaked,
        AdditionalCriteria: {}
      };
    }
    return output;
  } catch (e) {
    throw new Error(e.message) as AxiosError;
  }
}

const csvFilePath = "./LensData.csv";
let lastProcessedAddress = "";

async function processRow(row: { address: string }): Promise<Output> {
  return await main(row["address"]);
}

async function processAndSaveRow(row: { address: string }): Promise<Output> {
  const result = await processRow(row);
  lastProcessedAddress = row["address"];
  fs.appendFileSync("output_incremental.json", JSON.stringify(result) + ",\n", "utf8");
  fs.writeFileSync("checkpoint.json", JSON.stringify({ lastProcessedAddress }), "utf8");
  return result;
}

const startTime = new Date().getTime();

function parseCSV(): Promise<Output[]> {
  return new Promise((resolve, reject) => {
    const results: Output[] = [];
    let shouldProcess = !checkpoint.lastProcessedAddress;
    const stream = fs.createReadStream(csvFilePath).pipe(csv());

    stream
      .on("data", (data) => {
        stream.pause();

        if (!shouldProcess && data["address"] === checkpoint.lastProcessedAddress) {
          shouldProcess = true;
          stream.resume();
          return;
        }

        if (shouldProcess) {
          processAndSaveRow(data)
            .then(result => {
              results.push(result);
              stream.resume();
            })
            .catch(error => reject(error));
        }
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => reject(error));
  });
}

// Convert rows to JSON and write to a file
async function writeJSONFromCSV(): Promise<void> {
  try {
    const promises = await parseCSV();
    const jsonData = await Promise.all(promises);
    fs.writeFileSync("output.json", JSON.stringify(jsonData, null, 2), "utf8");
    console.log("Data successfully written to output.json");
  } catch (error) {
    console.error("Error processing the CSV file:", error);
  }
}
const endTime = new Date().getTime();

let checkpoint: Checkpoint = {};

try {
  checkpoint = JSON.parse(fs.readFileSync("checkpoint.json", "utf8"));
} catch (error) {
  console.log("No checkpoint found.");
}

writeJSONFromCSV();

const timeTaken = endTime - startTime;
console.log(`Function took ${timeTaken} milliseconds to execute.`);
