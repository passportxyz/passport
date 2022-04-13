import { Passport, Stamp, DID } from "@dpopp/types";
import React from "react";

// Class used as a base for each DataStorage Type
export abstract class DataStorageBase {
  abstract createPassport(): DID;
  abstract getPassport(did: DID): Passport | undefined;
  abstract addStamp(did: DID, stamp: Stamp): void;
}

// VC Data Type
export type vcData = {
  icon: string;
  verificationButton: JSX.Element;
  name: string;
  description: string;
  output: JSX.Element;
};
