import React, { useReducer } from "react";
import { Stamp } from "@gitcoin/passport-types";

export type OnAdd = (stamp: Stamp) => Promise<void>;
export type OnDelete = (stamp: Stamp) => Promise<void>;

export type Destination = {
  onAdd: OnAdd;
  onDelete: OnDelete;
};

export type StampStorageAction =
  | {
      type: "add";
      stamp: Stamp;
    }
  | {
      type: "delete";
      stamp: Stamp;
    }
  | {
      type: "initialize";
      stamps: Stamp[];
    }
  | {
      type: "registerDestination";
      destination: Destination;
    };

type StampStorageState = {
  stamps: Stamp[];
  destinations: Destination[];
};

const stampStorageReducer = (state: StampStorageState, action: StampStorageAction) => {
  switch (action.type) {
    case "add":
      return {
        ...state,
        stamps: [...state.stamps, action.stamp],
      };
    case "delete":
      return {
        ...state,
        stamps: state.stamps.filter((stamp: Stamp) => stamp.provider !== action.stamp.provider),
      };
    case "initialize":
      return {
        ...state,
        stamps: action.stamps,
      };
    case "registerDestination":
      return {
        ...state,
        destinations: [...state.destinations, action.destination],
      };
    default:
      return state;
  }
};

export const useStampStorageReducer = () => {
  const [state, dispatch] = useReducer(stampStorageReducer, {
    stamps: [],
    destinations: [],
  });

  // Returning as array to match useReducer, const tells TypeScript
  // that we'll be sure to destructure in the right order
  return [state, dispatch] as const;
};
