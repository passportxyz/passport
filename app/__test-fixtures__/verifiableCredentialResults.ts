import { VerifiableCredential, VerifiableCredentialRecord } from "@dpopp/types";

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

export const SUCCESFUL_ENS_RESULT: VerifiableCredentialRecord = {
  record: {
    type: "Ens",
    address: "0xcF323CE817E25b4F784bC1e14c9A99A525fDC50f",
    version: "0.0.0",
    ens: "test.eth",
  },
  signature:
    "0xbdbac10fdb0921e73df7575e47cbda484be550c36570bc146bed90c5dcb7435e64178cb263864f48af1ad6eeee1ee94c9a0794a3812ae861f8898a973233abea1c",
  challenge: credential,
  credential: credential,
};
