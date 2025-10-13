import { Proof } from "@zk-email/sdk";
import {
  AMAZON_CASUAL_PURCHASER_THRESHOLD,
  AMAZON_HEAVY_USER_THRESHOLD,
  AMAZON_REGULAR_CUSTOMER_THRESHOLD,
  UBER_OCCASIONAL_RIDER_THRESHOLD,
  UBER_POWER_USER_THRESHOLD,
  UBER_REGULAR_RIDER_THRESHOLD,
  AMAZON_STOP_FETCH_LIMIT,
  UBER_STOP_FETCH_LIMIT,
  type ProviderGroup,
} from "./types.js";
import type { RawEmailResponse } from "@zk-email/sdk";

export async function countVerifiedProofs(
  proofs: Proof[],
  stopAt?: number,
  maxConcurrency: number = 8
): Promise<number> {
  const target = typeof stopAt === "number" && stopAt > 0 ? stopAt : Infinity;
  let validCount = 0;
  let nextIndex = 0;
  let aborted = false;

  const runOne = async (idx: number): Promise<void> => {
    try {
      if (await proofs[idx].verify()) {
        validCount += 1;
      }
    } catch {
      // ignore errors -> count as invalid
    }
  };

  const worker = async (): Promise<void> => {
    while (!aborted) {
      const idx = nextIndex++;
      if (idx >= proofs.length) return;
      await runOne(idx);
      if (validCount >= target) {
        aborted = true;
        return;
      }
    }
  };

  const workers = Array(Math.min(maxConcurrency, proofs.length))
    .fill(0)
    .map(() => worker());
  await Promise.all(workers);
  return validCount;
}

export function getGroupMaxThreshold(group: ProviderGroup): number {
  return group === "amazon" ? AMAZON_HEAVY_USER_THRESHOLD : UBER_POWER_USER_THRESHOLD;
}

export function getRequestedMaxThreshold(group: ProviderGroup, payloadTypes?: string[]): number {
  if (!payloadTypes || payloadTypes.length === 0) return getGroupMaxThreshold(group);
  if (group === "amazon") {
    if (payloadTypes.includes("ZKEmail#AmazonHeavyUser")) return AMAZON_HEAVY_USER_THRESHOLD;
    if (payloadTypes.includes("ZKEmail#AmazonRegularCustomer")) return AMAZON_REGULAR_CUSTOMER_THRESHOLD;
    return AMAZON_CASUAL_PURCHASER_THRESHOLD;
  }
  // uber
  if (payloadTypes.includes("ZKEmail#UberPowerUser")) return UBER_POWER_USER_THRESHOLD;
  if (payloadTypes.includes("ZKEmail#UberRegularRider")) return UBER_REGULAR_RIDER_THRESHOLD;
  return UBER_OCCASIONAL_RIDER_THRESHOLD;
}

export function getStopFetchLimit(group: ProviderGroup): number {
  return group === "amazon" ? AMAZON_STOP_FETCH_LIMIT : UBER_STOP_FETCH_LIMIT;
}

export function shouldContinueFetchingEmails(
  moreEmails: RawEmailResponse[] | null | undefined,
  allProofsCount: number,
  group: ProviderGroup
): boolean {
  if (!moreEmails || !Array.isArray(moreEmails) || moreEmails.length === 0) {
    return false;
  }
  const maxProofs = getStopFetchLimit(group);
  return allProofsCount < maxProofs;
}

/**
 * Normalizes an Ethereum wallet address to lowercase with 0x prefix
 * @param address - Wallet address (with or without 0x)
 * @returns Normalized address (lowercase with 0x)
 * @throws Error if address is invalid
 */
export function normalizeWalletAddress(address: string): string {
  if (!address) {
    throw new Error("Wallet address is required");
  }

  const cleanAddress = address.toLowerCase().replace(/^0x/, "");

  if (!/^[0-9a-f]{40}$/i.test(cleanAddress)) {
    throw new Error(`Invalid wallet address format: ${address}`);
  }

  return `0x${cleanAddress}`;
}
