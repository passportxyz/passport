import { Stamp, VerifiableCredential } from "@gitcoin/passport-types";
import { CeramicPassport } from "./ceramicClient";

export function getTilesToCreate(stamps: Stamp[], did: string, passport?: CeramicPassport) {
  if (!passport) return undefined

  const existingStampIdentifiers = passport.stamps.map((s) => {
    const credential: VerifiableCredential = JSON.parse(s.credential);
    return { hash: credential.credentialSubject.hash, id: credential.credentialSubject.id }
  });

  const stampsToSave = stamps.filter((s) => {
    const identifier = { hash: s.credential.credentialSubject.hash, id: s.credential.credentialSubject.id };
    // Check that stamp is not already saved and that the DID matches the passport DID
    return !existingStampIdentifiers.includes(identifier) && did === s.credential.credentialSubject.id.toLocaleLowerCase();
  });

  return stampsToSave
}
