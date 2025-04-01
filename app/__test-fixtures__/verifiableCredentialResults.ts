import { CredentialResponseBody, VerifiableCredential, VerifiableCredentialRecord } from "@gitcoin/passport-types";

export const credential: VerifiableCredential = {
  "@context": ["https://www.w3.org/2018/credentials/v1"],
  type: ["VerifiableCredential"],
  credentialSubject: {
    id: "did:ethr:Test",
    "@context": {
      hash: "https://schema.org/Text",
      provider: "https://schema.org/Text",
    },
    hash: "randomValuesHash",
    provider: "Ens",
  },
  issuer: "did:key:randomValuesIssuer",
  issuanceDate: "2022-04-15T21:04:01.708Z",
  proof: {
    "@context": "https://www.w3.org/2018/credentials/v1",
    type: "EIP712",
    proofPurpose: "assertionMethod",
    verificationMethod: "did:key:randomValues",
    created: "2022-04-15T21:04:01.708Z",
    proofValue: "randomValuesProofValue",
    eip712Domain: {
      domain: {
        name: "randomValuesDomainName",
      },
      primaryType: "randomValuesPrimaryType",
      types: {
        "@context": [{ name: "dummy", type: "string" }],
      },
    },
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

export const SUCCESFUL_ENS_RESULTS: CredentialResponseBody = {
  record: { type: "Ens", version: "0.0.0", ens: "jimmyjim.eth" },
  credential,
};

export const UN_SUCCESSFUL_ENS_RESULT: CredentialResponseBody = {
  code: 403,
  error: "You can't claim this stamp",
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

export const VALID_LENS_VERIFICATION = {
  providerType: "Lens",
  payload: {
    valid: true,
    record: {
      address: "0x123",
      numberOfHandles: "1",
    },
  },
};

export const VALID_ENS_VERIFICATION = {
  providerType: "Ens",
  payload: {
    valid: true,
    record: {
      ens: "MEME",
    },
  },
};
