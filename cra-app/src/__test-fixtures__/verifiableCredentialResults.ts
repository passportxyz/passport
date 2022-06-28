import { VerifiableCredential, VerifiableCredentialRecord } from "@gitcoin/passport-types";

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

export const SUCCESFUL_ENS_RESULT: VerifiableCredentialRecord = {
  record: {
    type: "Ens",
    address: "0xcF323CE817E25b4F784bC1e14c9A99A525fDC50f",
    version: "0.0.0",
    ens: "test.eth",
  },
  signature: "0xbdbac10fdb0921e73df7575e47cbda484be550c......8af1ad6eeee1ee94c9a0794a3812ae861f8898a973233abea1c",
  challenge: credential,
  credential: credential,
};

export const SUCCESFUL_POAP_RESULT: VerifiableCredentialRecord = {
  record: {
    type: "POAP",
    address: "0xcF323CE817E25b4F784bC1e14c9A99A525fDC50f",
    version: "0.0.0",
    poaps: "2734,2134,3256",
  },
  signature: "0x....",
  challenge: credential,
  credential: credential,
};

export const SUCCESFUL_POH_RESULT: VerifiableCredentialRecord = {
  record: {
    type: "Poh",
    address: "0xcF323CE817E25b4F784bC1e14c9A99A525fDC50f",
    version: "0.0.0",
    poh: "Is registered",
  },
  signature: "0xbdbac10fdb0921e73df7575e47cbda484be550c......8af1ad6eeee1ee94c9a0794a3812ae861f8898a973233abea1c",
  challenge: credential,
  credential: credential,
};

export const SUCCESFUL_BRIGHTID_RESULT: VerifiableCredentialRecord = {
  record: {
    type: "Brightid",
    address: "0xcF323CE817E25b4F784bC1e14c9A99A525fDC50f",
    version: "0.0.0",
    contextId: "somedata",
    meets: "true",
  },
  signature: "0xbdbac10fdb0921e73df7575e47cbda484be550c......8af1ad6eeee1ee94c9a0794a3812ae861f8898a973233abea1c",
  challenge: credential,
  credential: credential,
};
