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

/**
 * Verifies proofs in parallel with optional early exit.
 *
 * Note: The frontend already limits payload sizes (max 60 Amazon, 85 Uber proofs),
 * so the early exit provides minimal benefit in practice. This implementation
 * prioritizes code clarity over micro-optimization.
 *
 * @param proofs - Array of proofs to verify
 * @param stopAt - Optional target count to stop at
 * @param maxConcurrency - Maximum concurrent verifications (default: 8)
 * @returns Actual count of verified proofs (may exceed stopAt slightly due to concurrency)
 */
export async function countVerifiedProofs(
  proofs: Proof[],
  stopAt?: number,
  maxConcurrency: number = 8
): Promise<number> {
  const target = typeof stopAt === "number" && stopAt > 0 ? stopAt : Infinity;
  let validCount = 0;
  let nextIndex = 0;

  /**
   * Gets the next proof index to verify.
   * Returns null when we've reached the target or end of array.
   */
  const getNextIndex = (): number | null => {
    if (nextIndex >= proofs.length || validCount >= target) {
      return null;
    }
    return nextIndex++;
  };

  const worker = async (): Promise<void> => {
    while (true) {
      const idx = getNextIndex();
      if (idx === null) return;

      try {
        if (await proofs[idx].verify()) {
          validCount++;
          // Early exit if we've reached the target
          // Note: Other workers may still be in-flight
          if (validCount >= target) return;
        }
      } catch {
        // Silently treat verification errors as invalid proofs
        // This maintains backward compatibility with existing behavior
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
