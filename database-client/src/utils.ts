import { Stamp, VerifiableCredential } from "@gitcoin/passport-types";

export function getTilesToCreate(stamps: Stamp[], did: string, existingStamps?: Stamp[]) {
  const existingStampIdentifiers = existingStamps.map((s) => {
    const credential: VerifiableCredential = s.credential;
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
