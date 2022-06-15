import { VerifiableCredential, Stamp, Passport } from "@gitcoin/passport-types";

const credential: VerifiableCredential = {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  type: ["VerifiableCredential"],
  credentialSubject: {
    id: "did:ethr:Test",
    "@context": [
      {
        hash: "https://schema.org/Text",
        provider: "https://schema.org/Text",
      },
    ],
    hash: "randomValuesHash",
    provider: "randomValuesProvider",
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

export const googleStampFixture: Stamp = {
  provider: "Google",
  credential,
};

export const ensStampFixture: Stamp = {
  provider: "Ens",
  credential,
};

export const pohStampFixture: Stamp = {
  provider: "Poh",
  credential,
};

export const twitterStampFixture: Stamp = {
  provider: "Twitter",
  credential,
};

export const facebookStampFixture: Stamp = {
  provider: "Facebook",
  credential,
};

export const brightidStampFixture: Stamp = {
  provider: "Brightid",
  credential,
};

export const githubStampFixture: Stamp = {
  provider: "Github",
  credential,
};

export const passportFixture: Passport = {
  issuanceDate: new Date("2022-01-01"),
  expiryDate: new Date("2022-01-02"),
  stamps: [googleStampFixture],
};

export const poapStampFixture: Stamp = {
  provider: "POAP",
  credential,
};
