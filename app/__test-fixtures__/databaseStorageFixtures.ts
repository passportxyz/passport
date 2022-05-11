import { VerifiableCredential, Stamp, Passport } from "@dpopp/types";

const credential: VerifiableCredential = {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  type: ["VerifiableCredential"],
  credentialSubject: {
    id: "did:ethr:Simple",
    "@context": [
      {
        root: "https://schema.org/Text",
      },
    ],
    root: "randomValuesRoot",
  },
  issuer: "did:key:randomValuesIssuer",
  issuanceDate: "2022-04-15T21:04:01.708Z",
  proof: {
    type: "Ed25519Signature2018",
    proofPurpose: "assertionMethod",
    verificationMethod: "did:key:randomValues",
    created: "2022-04-15T21:04:01.708Z",
    jws: "randomValues",
  },
  expirationDate: "2022-05-15T21:04:01.708Z",
};

export const simpleStampFixture: Stamp = {
  provider: "Simple",
  credential,
};

export const googleStampFixture: Stamp = {
  provider: "Google",
  credential,
};

export const ensStampFixture: Stamp = {
  provider: "Ens",
  credential,
};

export const passportFixture: Passport = {
  issuanceDate: new Date("2022-01-01"),
  expiryDate: new Date("2022-01-02"),
  stamps: [googleStampFixture],
};
