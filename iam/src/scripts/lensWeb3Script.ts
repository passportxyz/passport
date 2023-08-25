/* eslint-disable */
import * as dotenv from "dotenv";
import { writeFile as _writeFile } from "fs";
import * as fs from "fs";
import { promisify } from "util";
import { stakingSubgraph } from "@gitcoin/passport-platforms/src/GtcStaking/Providers/GtcStaking";
import { Stamp } from "@gitcoin/passport-types";
import { PROVIDER_ID, RequestPayload } from "@gitcoin/passport-types";
import axios from "axios";
import csv from "csv-parser";
import { BigNumber } from "ethers";
import {
  UserStakes,
  Output,
  GITCOIN_PASSPORT_WEIGHTS,
  web3Payloads,
  VerificationResults,
  hexToDecimal,
} from "./utils";

dotenv.config({ path: "../../.env" });
import { verifyTypes } from "../index";
import { AxiosError } from "axios";

function logSize(direction: string, data: any) {
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

let CURRENT_ADDRESS_HAS_PASSPORT = false;

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

const check = async (payload: RequestPayload): Promise<VerificationResults[]> => {
  let responses;
  // types filters out the types into an individual type
  const types = (payload.types?.length ? payload.types : [payload.type]).filter((type) => type);

  // verifyTypes returns whether the type is valid
  await verifyTypes(types, payload)
    .then((results) => {
      responses = results.filter((result) => {
        if (result.verifyResult.valid === true) {
          return { valid: result.verifyResult.valid, type: result.type }
        }
      });
    })
    .catch(() => "something went wrong");
  return responses;
};

const handleCheckForWeb3Stamps = async (address: string): Promise<Promise<VerificationResults[]>[]> => {
  try {
    return web3Payloads.map(async (payload) => {
    const updatedPayload = {...payload, address: address};
      return await check(updatedPayload);
    });
  } catch (e) {
    console.error(e)
  }
}

async function doesAddressHavePassport(address: string): Promise<boolean> {
  const response = await axios.get(`${GET_PASSPORT_ENDPOINT}${address}?limit=5`, headerOptions);
  const addressInRegistry = response.data.items.length > 0 ? true : false;
  
  return addressInRegistry;
}

async function getStamps(address: string): Promise<Stamp[]> {
  try {
    const response = await axios.get(`${GET_PASSPORT_ENDPOINT}${address}?limit=1000`, headerOptions);
    const data: Stamp[] = response.data.items;
    return data;
  } catch (e) {
    throw new Error(e.message) as AxiosError;
  }
}

async function checkGTCStaked(address: string): Promise<UserStakes> {
  try {
    const addressLower = address.toLowerCase();
    const response = await axios.post(stakingSubgraph, {
      query: getStakeQuery(addressLower),
    });
  
    const selfStake = BigNumber.from(response?.data?.data?.users[0]?.stakes[0]?.stake ?? "0");
    const communityStake = BigNumber.from(response?.data?.data?.users[0]?.xstakeAggregates[0]?.total ?? "0");
    return { selfStake, communityStake };
  } catch (e) {
    throw new Error(e.message) as AxiosError;
  }
}

async function scorePassport(address: any): Promise<number> {
  const data = {
    address: address,
    scorer_id: SCORER_ID,
    signature: "",
    nonce: "",
  };

  try {
    const response = await axios.post(SCORE_PASSPORT_ENDPOINT, data, headerOptions);

    return response.data.score;
  } catch (e) {
    throw new Error(e.message) as AxiosError;
  }
}

async function scoreWeb3Stamps(address: string, data: Promise<VerificationResults[]>[] | []): Promise<number> {
  // do a check if the web3 stamps are already in their passport. If not, score them
  let acc = 0;
  
  function totalScore(acc: number, item: { name: string; score: string; }) {
    return acc + parseInt(item.score);
  }

  if (CURRENT_ADDRESS_HAS_PASSPORT) {
    const passportWeb3Providers = [];
    const stamps = await getStamps(address);
    for (let stamp of stamps) {
      const { provider } = stamp;
      for (let web3Provider of GITCOIN_PASSPORT_WEIGHTS) {
        if (provider !== web3Provider.name) {
          passportWeb3Providers.push(provider);
        }
      }
    }
    for (let item of GITCOIN_PASSPORT_WEIGHTS) {
      passportWeb3Providers.map((provider: PROVIDER_ID) => {
        if (provider === item.name) {
          acc = totalScore(acc, item);
        }
      });
    }
  } else {
    for (let item of GITCOIN_PASSPORT_WEIGHTS) {
      data.map((el: any) => {
        if (el === undefined) {
          acc = 0;
        } else if (el.type === item.name && el.valid === true) {
          acc = totalScore(acc, item);
        }
      });
    }
  }
  
  return acc;
};

async function main(address: string): Promise<Output> {
  try {
    let output: Output;
    CURRENT_ADDRESS_HAS_PASSPORT = await doesAddressHavePassport(address);
    const { selfStake, communityStake} = await checkGTCStaked(address);
    const gtcStaked = hexToDecimal(selfStake) + hexToDecimal(communityStake);
    const addressLower = address.toLowerCase();

    if (CURRENT_ADDRESS_HAS_PASSPORT) {
      const score = await scorePassport(addressLower);
      const web3Score = await scoreWeb3Stamps(addressLower, []);

      output = {
        ScoreType: "Passport",
        Score: score + web3Score,
        GTCStaked: gtcStaked,
        AdditionalCriteria: {}
      };
    } else if (CURRENT_ADDRESS_HAS_PASSPORT === false) {
      const results = await handleCheckForWeb3Stamps(addressLower);
      const score = scoreWeb3Stamps(addressLower, results);

      output = {
        ScoreType: "Web3",
        Score: score,
        GTCStaked: gtcStaked,
        AdditionalCriteria: {}
      };
    }
    // console.log("output --->", output);
    
    return output;
  } catch (e) {
    throw new Error(e.message) as AxiosError;
  }
}

const csvFilePath = "./LensData.csv";

const startTime = new Date().getTime();

function parseCSV(): Promise<any[]> {
    return new Promise((resolve, reject) => {
        const results: any[] = [];
        fs.createReadStream(csvFilePath)
            .pipe(csv())
            .on("data", (data) => results.push(data))
            .on("end", () => {
                resolve(results);
            })
            .on("error", (error) => reject(error));
    });
}

// Convert rows to JSON and write to a file
async function writeJSONFromCSV(): Promise<void> {
    try {
        const jsonData = await parseCSV();
        fs.writeFileSync("output.json", JSON.stringify(jsonData, null, 2), "utf8");
        console.log("Data successfully written to output.json");
    } catch (error) {
        console.error("Error processing the CSV file:", error);
    }
}

writeJSONFromCSV();





const endTime = new Date().getTime();
const timeTaken = endTime - startTime;
console.log(`Function took ${timeTaken} milliseconds to execute.`);
