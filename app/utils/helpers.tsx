// import React from "react";

// --- Types
import { Passport, PROVIDER_ID, Stamp } from "@gitcoin/passport-types";
import { Providers, STAMP_PROVIDERS } from "../config/providers";

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
