import { Stamp, DID, PassportLoadResponse } from "@gitcoin/passport-types";

// Class used as a base for each DataStorage Type
// Implementations should enforce 1 Passport <-> 1 user
//  and it is assumed which Passport/user to act on when
//  calling createPassport, getPassport, addStamp
export abstract class DataStorageBase {
  abstract createPassport(): Promise<DID>;
  abstract getPassport(): Promise<PassportLoadResponse>;
  abstract addStamp(stamp: Stamp): Promise<void>;
}
