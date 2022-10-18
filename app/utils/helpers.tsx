// import React from "react";

// --- Types
import { PROVIDER_ID, PLATFORM_ID } from "@gitcoin/passport-types";

// --- Style Components
import { useToast } from "@chakra-ui/react";
import { DoneToastContent } from "../components/DoneToastContent";

// --- Stamp Data Point Helpers
export function difference(setA: Set<PROVIDER_ID>, setB: Set<PROVIDER_ID>) {
  const _difference = new Set(setA);
  setB.forEach((elem) => {
    _difference.delete(elem);
  });
  return _difference;
}
