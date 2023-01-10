// import React from "react";

// --- Types
import { Passport, PROVIDER_ID, Stamp } from "@gitcoin/passport-types";

// --- Stamp Data Point Helpers
export function difference(setA: Set<PROVIDER_ID>, setB: Set<PROVIDER_ID>) {
  const _difference = new Set(setA);
  setB.forEach((elem) => {
    _difference.delete(elem);
  });
  return _difference;
}

export const getExpiredStamps = (passport: Passport | undefined | false): Stamp[] => {
  if (passport) {
    return passport.stamps.filter((stamp: Stamp) => {
      if (stamp) {
        const has_expired = new Date(stamp.credential.expirationDate) < new Date();
        return has_expired;
      } else {
        return false;
      }
    });
  }

  return [];
};
