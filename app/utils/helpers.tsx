// import React from "react";

// --- Types
import { CredentialResponseBody, PROVIDER_ID, VerifiableCredential } from "@gitcoin/passport-types";
import axios, { AxiosResponse } from "axios";

// --- Stamp Data Point Helpers
export function difference(setA: Set<PROVIDER_ID>, setB: Set<PROVIDER_ID>) {
  const _difference = new Set(setA);
  setB.forEach((elem) => {
    _difference.delete(elem);
  });
  return _difference;
}

export function generateUID(length: number) {
  return window
    .btoa(
      Array.from(window.crypto.getRandomValues(new Uint8Array(length * 2)))
        .map((b) => String.fromCharCode(b))
        .join("")
    )
    .replace(/[+/]/g, "")
    .substring(0, length);
}

export function reduceStampResponse(providerIDs: PROVIDER_ID[], verifiedCredentials?: CredentialResponseBody[]) {
  if (!verifiedCredentials) return [];
  return verifiedCredentials
    .filter(
      (credential) =>
        !credential.error && providerIDs.find((providerId: PROVIDER_ID) => credential?.record?.type === providerId)
    )
    .map((credential) => ({
      provider: credential.record?.type as PROVIDER_ID,
      credential: credential.credential as VerifiableCredential,
    }));
}

export function checkShowOnboard(): boolean {
  const onboardTs = localStorage.getItem("onboardTS");
  if (!onboardTs) return true;
  // Get the current Unix timestamp in seconds.
  const currentTimestamp = Math.floor(Date.now() / 1000);

  // Calculate the timestamp for 3 months ago.
  // Note that this is an approximation because months have varying numbers of days.
  const threeMonthsInSeconds = 3 * 30 * 24 * 60 * 60;
  const threeMonthsAgoTimestamp = currentTimestamp - threeMonthsInSeconds;

  const onBoardOlderThanThreeMonths = parseInt(onboardTs) <= threeMonthsAgoTimestamp;

  // Check if the given timestamp is within the last 3 months.
  if (onBoardOlderThanThreeMonths) {
    localStorage.removeItem("onboardTS");
  }

  return onBoardOlderThanThreeMonths;
}

/**
 * Fetch data from a GraphQL endpoint
 *
 * @param query - The query to be executed
 * @param variables - The variables to be used in the query
 * @returns The result of the query
 */
export const graphql_fetch = async (query: string, variables: object = {}) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!process.env.NEXT_PUBLIC_EAS_INDEXER_URL) {
    throw new Error("NEXT_PUBLIC_EAS_INDEXER_URL is not defined");
  }

  try {
    const resp: AxiosResponse<any> = await axios.post(
      process.env.NEXT_PUBLIC_EAS_INDEXER_URL,
      JSON.stringify({ query, variables }),
      {
        headers,
      }
    );
    return Promise.resolve(resp.data);
  } catch (error: any) {
    if (error.response) {
      throw new Error(error.response.data);
    } else if (error.request) {
      throw new Error(`No response received: ${error.request}`);
    } else {
      throw new Error(`Request error: ${error.message}`);
    }
  }
};
