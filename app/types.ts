import { Passport, Stamp, DID } from "@dpopp/types";

// Class used as a base for each DataStorage Type
export abstract class DataStorageBase {
  abstract createPassport(): DID;
  abstract getPassport(did: DID): Passport | undefined;
  abstract addStamp(did: DID, stamp: Stamp): void;
}
