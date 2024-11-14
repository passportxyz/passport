// import React from "react";

// --- Types
import { ValidResponseBody, CredentialResponseBody, PROVIDER_ID, VerifiableCredential } from "@gitcoin/passport-types";
import axios, { AxiosResponse } from "axios";
import { datadogRum } from "@datadog/browser-rum";
import { Cacao } from "@didtools/cacao";
import { DID } from "dids";
import { parseAbi } from "viem";

// --- Stamp Data Point Helpers
export function difference(setA: Set<PROVIDER_ID>, setB: Set<PROVIDER_ID>) {
  const _difference = new Set(setA);
  setB.forEach((elem) => {
    _difference.delete(elem);
  });
  return _difference;
}

export function intersect<T>(setA: Set<T>, setB: Set<T>): Set<T> {
  return new Set([...setA].filter((item) => setB.has(item)));
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
    .filter((credential): credential is ValidResponseBody => !("error" in credential && credential.error))
    .filter((credential) => providerIDs.find((providerId: PROVIDER_ID) => credential?.record?.type === providerId))
    .map((credential) => ({
      provider: credential.record?.type as PROVIDER_ID,
      credential: credential.credential as VerifiableCredential,
    }));
}

// This is pulled out to support testing
// Use `checkShowOnboard` instead
export function _checkShowOnboard(currentOnboardResetIndex: string) {
  const savedOnboardResetIndex = localStorage.getItem("onboardResetIndex");

  localStorage.setItem("onboardResetIndex", currentOnboardResetIndex || "");

  if (currentOnboardResetIndex && currentOnboardResetIndex !== savedOnboardResetIndex) {
    localStorage.removeItem("onboardTS");
    return true;
  }

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

export function checkShowOnboard(): boolean {
  const currentOnboardResetIndex = process.env.NEXT_PUBLIC_ONBOARD_RESET_INDEX || "";
  return _checkShowOnboard(currentOnboardResetIndex);
}

/**
 * Fetch data from a GraphQL endpoint
 *
 * @param endpoint - The graphql endpoint
 * @param query - The query to be executed
 * @param variables - The variables to be used in the query
 * @returns The result of the query
 */
export const graphql_fetch = async (endpoint: URL, query: string, variables: object = {}) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    const resp: AxiosResponse<any> = await axios.post(endpoint.toString(), JSON.stringify({ query, variables }), {
      headers,
    });
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

/**
 * Checks if the server is on maintenance mode.
 *
 * @returns True if the server is on maintenance mode, false otherwise.
 */
export const isServerOnMaintenance = () => {
  if (process.env.NEXT_PUBLIC_MAINTENANCE_MODE_ON) {
    try {
      const maintenancePeriod = JSON.parse(process.env.NEXT_PUBLIC_MAINTENANCE_MODE_ON);
      const start = new Date(maintenancePeriod[0]);
      const end = new Date(maintenancePeriod[1]);
      const now = new Date();

      return now >= start && now <= end;
    } catch (error) {
      return false;
    }
  }

  return false;
};

export const createSignedPayload = async (did: DID, data: any) => {
  const { jws, cacaoBlock } = await did.createDagJWS(data);

  if (!cacaoBlock) {
    const msg = `Failed to create DagJWS for did: ${did.parent}`;
    datadogRum.addError(msg);
    throw msg;
  }

  // Get the JWS & serialize it (this is what we would send to the BE)
  const { link, payload, signatures } = jws;

  const cacao = await Cacao.fromBlockBytes(cacaoBlock);
  const issuer = cacao.p.iss;

  return {
    signatures: signatures,
    payload: payload,
    cid: Array.from(link ? link.bytes : []),
    cacao: Array.from(cacaoBlock ? cacaoBlock : []),
    issuer,
  };
};

// The parseAbi helper only works if we drop the word "tuple" from the human-readable abi
export const cleanAndParseAbi = (abi: string[]) => parseAbi(abi.map((item) => item.replace(/tuple\(/g, "(")));
