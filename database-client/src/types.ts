import {
  PROVIDER_ID,
  Stamp,
  PassportLoadResponse,
  StampPatch,
  SecondaryStorageAddResponse,
  SecondaryStorageDeleteResponse,
  SecondaryStorageBulkPatchResponse,
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

// To start reading from a secondary storage, CeramicContext will
// need to be updated to handle propagation of this data, etc.
// For now, we'll just define the write-only interface
export interface WriteOnlySecondaryDataStorageBase {
  did: string;
  addStamps: (stamps: Stamp[]) => Promise<SecondaryStorageAddResponse[]>;
  patchStamps: (stampPatches: StampPatch[]) => Promise<SecondaryStorageBulkPatchResponse>;
  deleteStamps: (providers: PROVIDER_ID[]) => Promise<SecondaryStorageDeleteResponse[]>;
}
