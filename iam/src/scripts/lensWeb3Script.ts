/* eslint-disable */
import axios from "axios";

// First check if the address is already in ceramic cache
// -- if yes
// ---- query passport 
// ---- check GTC staked
// ---- score passport
// -- if no
// ---- check if address qualifies for web3 stamp data points
// ------ if qualifies
// -------- score web3 stamps
// -------- check GTC staked
// ------ else
// -------- give score of 0

// API endpoints to hit in script
// -- Ceramic Cache
// -- GTC staking


/**
 * Output:
 * ScoreType: Distinguishing between Passport and web3.
 * Score: The actual numerical score.
 * GTC Staked: Amount of GTC staked by the user.
 * Additional Criteria: Any other pertinent data we deem necessary.
 */

const scorerEndpoint = process.env.PASSPORT_SCORER_BACKEND + "/ceramic-cache";

const scorerApiGetScore = process.env.PASSPORT_SCORER_BACKEND + "/ceramic-cache/score";

// const dbAccessToken = process.env.

interface Output {
  ScoreType: string;
  Score: number;
  GTC_Staked: number;
  AdditionalCriteria?: any;
}

async function isAddressInCeramicCache(address: string): Promise<boolean> {
  // TODO: Implement logic to check ceramic cache.
  // Return true if address is in cache, otherwise false.
  return false;
}
// Promise<any>
async function queryPassport(address: string): Promise<void> {
  const response = await axios.get(`${scorerApiGetScore}/${address}`, {
    headers: {
      // Authorization: `Bearer ${dbAccessToken}`,
    },
  });
  // TODO: Query the passport for given address.
  // Return the passport data.
}
// Promise<number>
async function checkGTCStaked(address: string): Promise<void> {
  // TODO: 
  // Return the amount of GTC staked for the address.
}

// Promise<number>
async function scorePassport(passport: any): Promise<void> {
  // TODO: 
  // Calculate and return the score for the passport.
  
}
// Promise<boolean>
async function qualifiesForWeb3Stamp(address: string): Promise<void> {
  // TODO: Check if address qualifies for web3 stamp data points.
  // Return true if it qualifies, otherwise false.
}
// Promise<number>
async function scoreWeb3Stamps(address: string): Promise<void> {
  // Score based on web3 stamps for the given address.
}
// Promise<Output>
async function main(address: string): Promise<void> {
  let output: Output;

  if (await isAddressInCeramicCache(address)) {
      const passport = await queryPassport(address);
      const score = await scorePassport(passport);
      const gtcStaked = await checkGTCStaked(address);

      // output = {
      //     ScoreType: 'Passport',
      //     Score: score,
      //     GTC_Staked: gtcStaked,
      //     AdditionalCriteria: {}
      // };

  // } else {
  //     if (await qualifiesForWeb3Stamp(address)) {
  //         const score = await scoreWeb3Stamps(address);
  //         const gtcStaked = await checkGTCStaked(address);

  //         output = {
  //             ScoreType: 'web3',
  //             Score: score,
  //             GTC_Staked: gtcStaked,
  //             AdditionalCriteria: {}
  //         };
  //     } else {
  //         output = {
  //             ScoreType: 'web3',
  //             Score: 0,
  //             GTC_Staked: 0,
  //             AdditionalCriteria: {}
  //         };
  //     }
  }

  // return output;
}

main("someAddress").then(console.log);
