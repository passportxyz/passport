import {
  PROVIDER_ID,
  Stamp,
  PassportLoadStatus,
  PassportLoadResponse,
  PassportLoadErrorDetails,
  Passport,
  StampPatch,
} from "@gitcoin/passport-types";

// Class used as a base for each DataStorage Type
// Implementations should enforce 1 Passport <-> 1 user
//  and it is assumed which Passport/user to act on when
//  calling createPassport, getPassport, addStamp
export interface DataStorageBase {
  did: string;
  createPassport: () => Promise<PassportLoadResponse>;
  getPassport: () => Promise<PassportLoadResponse>;
  addStamps: (stamps: Stamp[]) => Promise<PassportLoadResponse>;
  patchStamps: (stampPatches: StampPatch[]) => Promise<PassportLoadResponse>;
  deleteStamps: (providers: PROVIDER_ID[]) => Promise<PassportLoadResponse>;
}

export interface CeramicStorage {
  did: string;
  setStamps: (stamps: Stamp[]) => Promise<void>;
  deleteStampIDs: (streamIds: string[]) => Promise<void>;
}
