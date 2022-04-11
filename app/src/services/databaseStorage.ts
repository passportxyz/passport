import { DataStorageBase, DID, Passport, Stamp } from "@dpopp/types";

export class LocalStorageDatabase implements DataStorageBase {
  passportKey: string;

  constructor(address: string) {
    const _passportKey = `dpopp::${address}`;
    this.passportKey = _passportKey;
  }

  createPassport(): DID {
    const newPassport = {
      issuanceDate: new Date(),
      expiryDate: new Date(),
      stamps: [],
    };
    window.localStorage.setItem(this.passportKey, JSON.stringify(newPassport));
    return this.passportKey;
  }
  getPassport(did: DID): Passport | undefined {
    const stringifiedPassport = window.localStorage.getItem(did);
    if (stringifiedPassport === null) return undefined;
    const passport = JSON.parse(stringifiedPassport) as { issuanceDate: string; expiryDate: string; stamps: Stamp[] };
    return passport
      ? {
          issuanceDate: new Date(passport.issuanceDate),
          expiryDate: new Date(passport.expiryDate),
          stamps: passport.stamps,
        }
      : undefined;
  }
  addStamp(did: DID, stamp: Stamp): void {
    console.log("add stamp here");
  }
}
