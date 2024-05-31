/* eslint-disable */

import { platforms, providers } from "@gitcoin/passport-platforms";
import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
export type VerifyTypeResult = {
  verifyResult: VerifiedPayload;
  type: string;
  error?: string;
  code?: number;
};

const providerTypePlatformMap = Object.entries(platforms).reduce(
  (acc, [platformName, { providers }]) => {
    providers.forEach(({ type }) => {
      acc[type] = platformName;
    });
    return acc;
  },
  {} as { [k: string]: string }
);

function groupProviderTypesByPlatform(types: string[]): string[][] {
  return Object.values(
    types.reduce(
      (groupedProviders, type) => {
        const platform = providerTypePlatformMap[type] || "generic";

        if (!groupedProviders[platform]) groupedProviders[platform] = [];
        groupedProviders[platform].push(type);

        return groupedProviders;
      },
      {} as { [k: keyof typeof platforms]: string[] }
    )
  );
}

export async function verifyTypes(types: string[], payload: RequestPayload): Promise<VerifyTypeResult[]> {
  // define a context to be shared between providers in the verify request
  // this is intended as a temporary storage for providers to share data
  const context: ProviderContext = {};
  const results: VerifyTypeResult[] = [];

  await Promise.all(
    // Run all platforms in parallel
    groupProviderTypesByPlatform(types).map(async (platformTypes) => {
      // Iterate over the types within a platform in series
      // This enables providers within a platform to reliably share context
      for (const type of platformTypes) {
        let verifyResult: VerifiedPayload = { valid: false };
        let code, error;

        try {
          // verify the payload against the selected Identity Provider
          verifyResult = await providers.verify(type, payload, context);
          if (!verifyResult.valid) {
            code = 403;
            // TODO to be changed to just verifyResult.errors when all providers are updated
            const resultErrors = verifyResult.errors;
            error = resultErrors?.join(", ")?.substring(0, 1000) || "Unable to verify provider";
          }
        } catch {
          error = "Unable to verify provider";
          code = 400;
        }

        results.push({ verifyResult, type, code, error });
      }
    })
  );

  return results;
}

const payload = {
  type: "bulk",
  types: [
    "Ens",
    "NFTScore#50",
    "NFTScore#75",
    "NFTScore#90",
    "NFT",
    "GitcoinContributorStatistics#totalContributionAmountGte#10",
    "GitcoinContributorStatistics#totalContributionAmountGte#100",
    "GitcoinContributorStatistics#totalContributionAmountGte#1000",
    "SnapshotProposalsProvider",
    "zkSyncScore#5",
    "zkSyncScore#20",
    "zkSyncScore#50",
    "ZkSyncEra",
    "Lens",
    "GnosisSafe",
    "ETHScore#50",
    "ETHScore#75",
    "ETHScore#90",
    "ETHGasSpent#0.25",
    "ETHnumTransactions#100",
    "ETHDaysActive#50",
    "SelfStakingBronze",
    "SelfStakingSilver",
    "SelfStakingGold",
    "BeginnerCommunityStaker",
    "ExperiencedCommunityStaker",
    "TrustedCitizen",
    "GuildAdmin",
    "GuildPassportMember",
    "TrustaLabs",
  ],
  address: "0x0636f974d29d947d4946b2091d769ec6d2d415de",
  version: "0.0.0",
};

function main() {
  const types = (payload.types?.length ? payload.types : [payload.type]).filter((type) => type);


  verifyTypes(types, payload)
    .then((results) => {

      const responses = results.map(({ verifyResult, type, error, code }) => ({
        valid: verifyResult.valid,
        type,
        error,
        code,
      }));
      console.log({responses});
    })
    .catch(() => console.log("Unable to check payload", 500))
    .finally(() => console.log("done"));
}

main()
