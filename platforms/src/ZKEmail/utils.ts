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
