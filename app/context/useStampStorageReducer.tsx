import React, { useReducer } from "react";
import { Stamp, PROVIDER_ID } from "@gitcoin/passport-types";

export type StampStorageAction =
  | {
      type: "add";
      stamps: Stamp[];
    }
  | {
      type: "delete";
      providers: PROVIDER_ID[];
    }
  | {
      type: "clear";
    };

const stampStorageReducer = (stamps: Stamp[], action: StampStorageAction) => {
  switch (action.type) {
    case "add":
      return [...stamps, ...action.stamps];
    case "delete":
      return stamps.filter((stamp: Stamp) =>
        action.providers.find((provider: PROVIDER_ID) => provider === stamp.provider)
      );
    case "clear":
      return [];
    default:
      return stamps;
  }
};

export const useStampStorageReducer = () => {
  const [state, dispatch] = useReducer(stampStorageReducer, []);

  // Returning as array to match useReducer, const tells TypeScript
  // that we'll be sure to destructure in the right order
  return [state, dispatch] as const;
};
