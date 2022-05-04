import { Passport, Stamp, DID } from "@dpopp/types";

// Class used as a base for each DataStorage Type
// Implementations should enforce 1 Passport <-> 1 user
//  and it is assumed which Passport/user to act on when
//  calling createPassport, getPassport, addStamp
export abstract class DataStorageBase {
  abstract createPassport(): Promise<DID>;
  abstract getPassport(): Promise<Passport | undefined>;
  abstract addStamp(stamp: Stamp): Promise<void>;
}
