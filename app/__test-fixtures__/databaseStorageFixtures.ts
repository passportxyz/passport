import { VerifiableCredential, Stamp, Passport } from "@gitcoin/passport-types";

const getCredential = (): VerifiableCredential => {
  return {
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
};

export const googleStampFixture: Stamp = {
  provider: "Google",
  credential: getCredential(),
};
console.log("googleStampFixture", googleStampFixture);

export const ensStampFixture: Stamp = {
  provider: "Ens",
  credential: getCredential(),
};

export const pohStampFixture: Stamp = {
  provider: "Lens",
  credential: getCredential(),
};

export const twitterStampFixture: Stamp = {
  provider: "ZkSyncEra",
  credential: getCredential(),
};

export const brightidStampFixture: Stamp = {
  provider: "Brightid",
  credential: getCredential(),
};

export const githubStampFixture: Stamp = {
  provider: "Github",
  credential: getCredential(),
};

export const discordStampFixture: Stamp = {
  provider: "Discord",
  credential: getCredential(),
};

export const passportFixture: Passport = {
  issuanceDate: new Date("2022-01-01"),
  expiryDate: new Date("2022-01-02"),
  stamps: [googleStampFixture],
};

export const poapStampFixture: Stamp = {
  provider: "POAP",
  credential: getCredential(),
};

export const linkedinStampFixture: Stamp = {
  provider: "Linkedin",
  credential: getCredential(),
};
console.log("googleStampFixture", googleStampFixture);
