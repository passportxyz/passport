import http from "k6/http";
import exec from "k6/execution";
import { randomSeed } from "k6";
import { check } from "k6";
import { SharedArray } from "k6/data";

randomSeed(234123521532);

function getRandomInt(max) {
  const ret = Math.floor(Math.random() * max);
  return ret;
}

export const options = {
  ext: {
    loadimpact: {
      projectID: 3643521,
      // Test runs with the same name groups test runs together
      name: "Test Embed Service",
      distribution: {
        US: { loadZone: "amazon:us:ashburn", percent: 50 },
        Ireland: { loadZone: "amazon:ie:dublin", percent: 50 },
      },
    },
  },
};

// Environment variables
const embedUrl = __ENV.EMBED_URL || "https://embed.staging.passport.gitcoin.co";
const scorerId = __ENV.SCORER_ID || "24";
const numAccounts = Number.parseInt(__ENV.NUM_ACCOUNTS) || 100;
const xApiKey = __ENV.X_API_KEY;

export function setup() {
  // Setup function - can be used to initialize test data
  return {};
}

export function teardown(data) {
  // Teardown function - cleanup if needed
}

// Load test data (supports array of strings or array of { address, private_key })
const accountsRaw = JSON.parse(open(`../test_data/generated_accounts_${numAccounts}.json`));
const addresses = Array.isArray(accountsRaw)
  ? accountsRaw
      .map((item) => (typeof item === "string" ? item : item && item.address ? item.address : undefined))
      .filter((addr) => typeof addr === "string" && addr.length > 0)
  : [];

const userTokens = JSON.parse(open("../generate_test_auth_tokens/user-tokens.json"));

const userVcs = new SharedArray("userVcs", function () {
  const userVcs = [];

  for (let i = 0; i < numAccounts; i++) {
    const address = addresses[i];
    const vcs = JSON.parse(open(`../test_data/vcs/${address}_vcs.json`));
    userVcs.push(vcs);
  }

  return userVcs;
});

// Main test function
export default function () {
  // To avoid deadlock, # VUs should be <= # accounts
  const addressIdx = (exec.vu.idInTest - 1) % numAccounts;
  const address = addresses[addressIdx];
  const vcs = userVcs[addressIdx];
  const token = userTokens[address];

  const requestOptions = {
    headers: {
      "Content-Type": "application/json",
      ...(xApiKey ? { "X-API-KEY": xApiKey } : {}),
    },
    timeout: "90s",
  };

  const authRequestOptions = {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(xApiKey ? { "X-API-KEY": xApiKey } : {}),
    },
    timeout: "90s",
  };

  ////////////////////////////////////////////////////////////////////////////////////////////////////
  // Health Check
  ////////////////////////////////////////////////////////////////////////////////////////////////////
  const healthResponse = http.get(`${embedUrl}/health`);

  check(healthResponse, {
    "Health check status 200": (r) => r.status === 200,
  });

  if (healthResponse.status !== 200) {
    console.log("Health check failed: ", JSON.stringify(healthResponse, undefined, 2));
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////
  // Get Stamps Metadata
  ////////////////////////////////////////////////////////////////////////////////////////////////////
  const metadataResponse = http.get(`${embedUrl}/embed/stamps/metadata?scorerId=${scorerId}`, requestOptions);

  check(metadataResponse, {
    "Metadata request status 200": (r) => r.status === 200,
  });

  if (metadataResponse.status !== 200) {
    console.log("Metadata request failed: ", JSON.stringify(metadataResponse, undefined, 2));
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////
  // Get Challenge
  ////////////////////////////////////////////////////////////////////////////////////////////////////
  const challengePayload = {
    payload: {
      address: address,
      type: "Simple",
      signatureType: "Ed25519",
    },
  };

  const challengeResponse = http.post(`${embedUrl}/embed/challenge`, JSON.stringify(challengePayload), requestOptions);

  check(challengeResponse, {
    "Challenge request status 200": (r) => r.status === 200,
  });

  if (challengeResponse.status !== 200) {
    console.log("Challenge request failed: ", JSON.stringify(challengeResponse, undefined, 2));
    return; // Skip remaining tests if challenge fails
  }

  const challenge = JSON.parse(challengeResponse.body);

  ////////////////////////////////////////////////////////////////////////////////////////////////////
  // Auto-Verify Stamps (simulate automatic verification)
  ////////////////////////////////////////////////////////////////////////////////////////////////////
  const credentialIds = ["Ens", "NFTScore#50", "GitcoinContributorStatistics#totalContributionAmountGte#10"];

  const autoVerifyPayload = {
    address: address,
    scorerId: scorerId,
    credentialIds: credentialIds,
  };

  const autoVerifyResponse = http.post(
    `${embedUrl}/embed/auto-verify`,
    JSON.stringify(autoVerifyPayload),
    authRequestOptions
  );

  check(autoVerifyResponse, {
    "Auto-verify request status 200": (r) => r.status === 200,
  });

  if (autoVerifyResponse.status !== 200) {
    console.log("Auto-verify request failed: ", JSON.stringify(autoVerifyResponse, undefined, 2));
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////
  // Manual Verification (simulate user providing proofs)
  ////////////////////////////////////////////////////////////////////////////////////////////////////
  const verifyPayload = {
    challenge: challenge,
    payload: {
      address: address,
      type: "Simple",
      types: ["Simple", "ClearTextSimple"],
      version: "0.0.0",
      proofs: {
        username: "test_user",
        valid: "true",
        signature: "mock_signature_for_testing",
      },
    },
    scorerId: scorerId,
  };

  const verifyResponse = http.post(`${embedUrl}/embed/verify`, JSON.stringify(verifyPayload), authRequestOptions);

  check(verifyResponse, {
    "Verify request status 200": (r) => r.status === 200,
  });

  if (verifyResponse.status !== 200) {
    console.log("Verify request failed: ", JSON.stringify(verifyResponse, undefined, 2));
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////
  // Get Score
  ////////////////////////////////////////////////////////////////////////////////////////////////////
  const scoreResponse = http.get(`${embedUrl}/embed/score/${scorerId}/${address}`, authRequestOptions);

  check(scoreResponse, {
    "Score request status 200": (r) => r.status === 200,
  });

  if (scoreResponse.status !== 200) {
    console.log("Score request failed: ", JSON.stringify(scoreResponse, undefined, 2));
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////
  // Simulate multiple stamp operations
  ////////////////////////////////////////////////////////////////////////////////////////////////////
  for (let i = 0; i < 3; i++) {
    // Randomly select some VCs for testing
    const selectedVcs = [];
    const numStamps = Math.min(3, vcs.length);

    for (let j = 0; j < numStamps; j++) {
      const randomVc = vcs[getRandomInt(vcs.length)];
      if (!selectedVcs.find((vc) => vc.credentialSubject.provider === randomVc.credentialSubject.provider)) {
        selectedVcs.push(randomVc);
      }
    }

    // Test auto-verify with different credential sets
    const credentialIds = selectedVcs.map((vc) => vc.credentialSubject.provider);

    const batchAutoVerifyPayload = {
      address: address,
      scorerId: scorerId,
      credentialIds: credentialIds,
    };

    const batchAutoVerifyResponse = http.post(
      `${embedUrl}/embed/auto-verify`,
      JSON.stringify(batchAutoVerifyPayload),
      authRequestOptions
    );

    check(batchAutoVerifyResponse, {
      [`Batch ${i} auto-verify status 200`]: (r) => r.status === 200,
    });

    if (batchAutoVerifyResponse.status !== 200) {
      console.log(`Batch ${i} auto-verify failed: `, JSON.stringify(batchAutoVerifyResponse, undefined, 2));
    }

    // Get updated score after each batch
    const updatedScoreResponse = http.get(`${embedUrl}/embed/score/${scorerId}/${address}`, authRequestOptions);

    check(updatedScoreResponse, {
      [`Updated score ${i} status 200`]: (r) => r.status === 200,
    });

    if (updatedScoreResponse.status !== 200) {
      console.log(`Updated score ${i} failed: `, JSON.stringify(updatedScoreResponse, undefined, 2));
    }
  }
}
