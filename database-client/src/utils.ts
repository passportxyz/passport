import { Stamp, VerifiableCredential } from "@gitcoin/passport-types";
import { CeramicPassport } from "./ceramicClient";

export function getTilesToCreate(stamps: Stamp[], did: string, passport?: CeramicPassport) {
  if (!passport) return undefined

  const existingStampIdentifiers = passport.stamps.map((s) => {
    const credential: VerifiableCredential = JSON.parse(s.credential);
    return { hash: credential.credentialSubject.hash, issuanceDate: credential.issuanceDate }
  });

  const stampsToSave = stamps.filter((s) => {
    const identifier = { hash: s.credential.credentialSubject.hash, issuanceDate: s.credential.issuanceDate };
    // Check that stamp is not already saved and that the DID matches the passport DID
    return !existingStampIdentifiers.some(existingIdentifier => (
      existingIdentifier.hash === identifier.hash &&
      existingIdentifier.issuanceDate === identifier.issuanceDate
    ));
  });

  return stampsToSave
}
