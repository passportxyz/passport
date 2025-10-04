import { AMAZON_STOP_FETCH_LIMIT, ProviderGroup, UBER_STOP_FETCH_LIMIT } from "./types.js";
import type { RawEmailResponse } from "@zk-email/sdk";

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
