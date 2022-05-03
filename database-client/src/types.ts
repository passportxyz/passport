import { Passport, Stamp, DID } from "@dpopp/types";

// Class used as a base for each DataStorage Type
export abstract class DataStorageBase {
  abstract createPassport(): Promise<DID>;
  abstract getPassport(did: DID): Promise<Passport | undefined>;
  abstract addStamp(did: DID, stamp: Stamp): Promise<void>;
}
