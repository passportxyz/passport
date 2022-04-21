import { DID, Passport, Stamp } from "@dpopp/types";
import { DataStorageBase } from "../types";

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
    const parsedPassport = JSON.parse(stringifiedPassport) as {
      issuanceDate: string;
      expiryDate: string;
      stamps: Stamp[];
    };
    const passport = {
      issuanceDate: new Date(parsedPassport.issuanceDate),
      expiryDate: new Date(parsedPassport.expiryDate),
      stamps: parsedPassport.stamps,
    };
    return passport ?? undefined;
  }
  addStamp(did: DID, stamp: Stamp): void {
    const passport = this.getPassport(did);
    if (passport) {
      passport.stamps.push(stamp);
      window.localStorage.setItem(did, JSON.stringify(passport));
    } else {
      const newPassport = {
        issuanceDate: new Date(),
        expiryDate: new Date(),
        stamps: [stamp],
      };
      window.localStorage.setItem(did, JSON.stringify(newPassport));
    }
  }
}
