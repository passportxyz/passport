/*
To start off with we give the network an initial score based on their MDB score for ethereum.
We then open up the trust graph to include the one P2P metric we currently have. Community Staking.
  - With community staking we give points to those who have had GTC staked on them.
  - By staking your money on another address you are saying that you trust that address.
Finally we apply a test score to each address in the network. For this test the first address in the list receives a negative one and the last address receives a positive one.
  - By doing this we are seeing the impact of our scoring metric on an existing network of trust.

This network derives its value from P2P trust. Ideally we can create a system that incentvises participation. We could provide an initial score for a set of addresses(passport score).
Signifying our initial trust in the network(or set of eligible airdrop addresses). After the public is given time to participate we could then score every address with our MDB endpoint and furth analysis


*/

// To run script from iam dir `yarn node --loader ts-node/esm src/transitive-trust.ts`
// 2024-09-23_23-23-12.csv can be pulled from https://api.staging.scorer.gitcoin.co/admin/registry/batchmodelscoringrequest/49/change/

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { TransitiveTrustGraph } from "@ethereum-attestation-service/transitive-trust-sdk";
import communityStakes from "../sample-community-stakes-above-1.json" assert { type: "json" };
import fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const graph = new TransitiveTrustGraph();

// MDB Results
const iamIssuer = "0xd6f8d6ca86aa01e551a311d670a0d1bd8577e5fb";
const mdbScores = transformCsvColumnToJsonArray("2024-09-23_23-23-12.csv", "Result");

type Score = {
  score: number;
  address: string;
};

const highScorers: Score[] = [];
const lowScorers: Score[] = [];
const stakeeScores: Score[] = [];

const stakees = communityStakes.map((stake) => stake.stakee.toLowerCase());

type TrustScores = {
  [target: string]: {
    positiveScore: number;
    negativeScore: number;
    netScore: number;
  };
};

// Insert node that represents MDB score for each address that participated in staking
mdbScores.map((row: { models: { ethereum_activity: { score: number } }; address: string }) => {
  const { score } = row.models.ethereum_activity;
  let positiveWeight = 0;
  if (score < 0 || score <= 20) {
    positiveWeight = 0;
  } else {
    if (score > 20) {
      positiveWeight = 1;
    } else {
      positiveWeight = score / 20;
    }
  }
  let negativeWeight = 0;
  if (score > 0 && score < 20) {
    negativeWeight = (20 - score) / 20;
  }

  if (score > 95) {
    highScorers.push({ address: row.address, score });
  }
  if (score < 5) {
    lowScorers.push({ address: row.address, score });
  }

  if (stakees.includes(row.address)) {
    stakeeScores.push({ address: row.address, score });
  }

  graph.addEdge(iamIssuer, row.address, positiveWeight, negativeWeight);
});

// Determine scores from passport perspective
const initialTrustScores: TrustScores = graph.computeTrustScores(iamIssuer);

// Insert edges that represent staking relationships - points are incremented for addresses that have been staked on.
for (const stake of communityStakes) {
  const { current_amount } = stake;
  const staker = stake.staker.toLowerCase();
  const stakee = stake.stakee.toLowerCase();
  const scale = 50;
  const positiveWeight = current_amount > scale ? 1 : current_amount / scale;
  const negativeWeight = 0;

  graph.addEdge(staker, stakee, positiveWeight, negativeWeight);
}

// Determine score after staking
const trustScoresAfterStakeData: TrustScores = graph.computeTrustScores(iamIssuer);

// Convert Sets to arrays
const stakeeAddressesByStaker = Object.fromEntries(
  Object.entries(getStakeeAddressesByStaker(communityStakes)).map(([staker, stakees]) => [staker, Array.from(stakees)])
);

console.log("Stakee Addresses by Staker:");
console.log(JSON.stringify(stakeeAddressesByStaker, null, 2));

// Here we will add a new edge that increments or decrements the score of each address.
// This will test the impact of a score that we control and apply
mdbScores.map((row: { models: { ethereum_activity: { score: number } }; address: string }, i) => {
  const addressCount = mdbScores.length;
  const bottomHalf = addressCount / 2;
  if (i < bottomHalf) {
    // give it a negative score between 0 and 1
    const negativeScore = (bottomHalf - i) / bottomHalf;
    console.log("negativeScore: ", negativeScore);
    graph.addEdge(iamIssuer, row.address, 0, negativeScore);
  } else {
    // give it a positive score between 0 and 1, where the last value receives the highest value with a score of 1
    const positiveScore = i / addressCount;
    console.log("positiveScore: ", positiveScore, i, addressCount);
    graph.addEdge(iamIssuer, row.address, positiveScore, 0);
  }
});

const trustScoreAfterTestPassportScore: TrustScores = graph.computeTrustScores(iamIssuer);

// Determine difference in scores before and after
const delta = stakeeScores.map((scoreVal) => {
  const { address, score } = scoreVal;
  const before = initialTrustScores[address].netScore;
  const after = trustScoresAfterStakeData[address].netScore;
  return {
    address,
    score,
    before,
    after,
  };
});

const differences = delta.filter((val) => val.before !== val.after);

const trustScoreDifferences = calculateTrustScoreDifferences(
  initialTrustScores,
  trustScoresAfterStakeData,
  trustScoreAfterTestPassportScore
);

console.log("Trust Score Differences:");
console.log(JSON.stringify(trustScoreDifferences, null, 2));

debugger;

// // // // // // //
// Utility Functions
// // // // // // //

type StakeObject = {
  id: number;
  chain: number;
  lock_time: string;
  unlock_time: string;
  last_updated_in_block: number;
  staker: string;
  stakee: string;
  current_amount: number;
};

function getStakeeAddressesByStaker(stakes: StakeObject[]): Record<string, Set<string>> {
  return stakes.reduce(
    (result, stake) => {
      if (!result[stake.staker]) {
        result[stake.staker] = new Set<string>();
      }
      result[stake.staker].add(stake.stakee);
      return result;
    },
    {} as Record<string, Set<string>>
  );
}

function calculateTrustScoreDifferences(
  initialTrustScores: TrustScores,
  trustScoresAfterStakeData: TrustScores,
  trustScoreAfterTestPassportScore: TrustScores
): { [address: string]: { initial: number; afterStake: number; afterPassportScore: number } } {
  const differences: {
    [address: string]: { initial: number; afterStake: number; afterPassportScore: number };
  } = {};

  // Combine all addresses from all three score objects
  const allAddresses = new Set([
    ...Object.keys(initialTrustScores),
    ...Object.keys(trustScoresAfterStakeData),
    ...Object.keys(trustScoreAfterTestPassportScore),
  ]);

  mdbScores
    .map(({ address }: { address: string }) => address)
    .filter((address) => stakees.includes(address))
    .forEach((address) => {
      const initial = initialTrustScores[address]?.netScore || 0;
      const afterStake = trustScoresAfterStakeData[address]?.netScore || 0;
      const afterPassportScore = trustScoreAfterTestPassportScore[address]?.netScore || 0;

      differences[address] = {
        initial,
        afterStake,
        afterPassportScore,
      };
    });

  return differences;
}

const nonZeroTrustScores = (graph: {
  [target: string]: {
    positiveScore: number;
    negativeScore: number;
    netScore: number;
  };
}) =>
  Object.values(graph).filter(
    (score) => score.negativeScore !== 0 || score.positiveScore !== 0 || score.netScore !== 0
  );

function isEqual(obj1: TrustScores[string], obj2: TrustScores[string]): boolean {
  return (
    obj1.positiveScore === obj2.positiveScore &&
    obj1.negativeScore === obj2.negativeScore &&
    obj1.netScore === obj2.netScore
  );
}

function deepTrustScoreDifference(initialScores: TrustScores, updatedScores: TrustScores): TrustScores {
  const difference: TrustScores = {};

  // Check for targets in initialScores that are different or not in updatedScores
  for (const target in initialScores) {
    if (!(target in updatedScores) || !isEqual(initialScores[target], updatedScores[target])) {
      difference[target] = { ...initialScores[target] };
    }
  }

  // Check for new targets in updatedScores
  for (const target in updatedScores) {
    if (!(target in initialScores)) {
      difference[target] = { ...updatedScores[target] };
    }
  }

  return difference;
}

function transformCsvColumnToJsonArray(filePath: string, columnName: string): unknown[] {
  try {
    // Attempt to resolve the file path in different locations
    const possiblePaths = [
      path.resolve(process.cwd(), filePath),
      path.resolve(__dirname, filePath),
      path.resolve(process.cwd(), "..", filePath),
    ];

    let resolvedPath: string | undefined;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        resolvedPath = p;
        break;
      }
    }

    if (!resolvedPath) {
      throw new Error(`File not found: ${filePath}. Searched in:\n${possiblePaths.join("\n")}`);
    }

    console.log(`Reading file from: ${resolvedPath}`);

    // Read the CSV file
    const csvContent = fs.readFileSync(resolvedPath, "utf-8");

    // Parse the CSV content
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    // Extract the specified column and parse it as JSON
    return records
      .map((record: { [key: string]: string }) => {
        try {
          const value = JSON.parse(record[columnName]);
          value.address = record.Address.toLowerCase();
          return value;
        } catch (error) {
          console.error(`Error parsing JSON in row: ${JSON.stringify(record)}`);
          return null;
        }
      })
      .filter((item: unknown) => item !== null);
  } catch (error) {
    console.error(`Error processing file: ${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

const writeCsv = () => {
  const stakees = new Set(communityStakes.map((stake) => stake.stakee));
  const stakers = new Set(communityStakes.map((stake) => stake.staker));
  const allAddresses = new Set([...stakees, ...stakers]);

  try {
    let csvContent = "Address\n"; // CSV header
    Array.from(allAddresses).forEach((address) => {
      csvContent += `${address}\n`;
    });

    fs.writeFileSync("addresses.csv", csvContent);
    console.log("CSV file 'addresses.csv' has been created successfully.");
  } catch (error) {
    console.error("Error writing CSV file:", error);
  }
};

// writeCsv();
