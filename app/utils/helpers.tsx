// import React from "react";

// --- Types
import { PROVIDER_ID } from "@gitcoin/passport-types";

// --- Stamp Data Point Helpers
export function difference(setA: Set<PROVIDER_ID>, setB: Set<PROVIDER_ID>) {
  const _difference = new Set(setA);
  setB.forEach((elem) => {
    _difference.delete(elem);
  });
  return _difference;
}
