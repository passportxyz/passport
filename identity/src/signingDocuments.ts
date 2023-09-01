interface Eip712Field {
  type: string;
  name: string;
}

interface Eip712Type {
  [key: string]: Eip712Field[];
}

interface Eip712Domain<T extends Eip712Type> {
  domain: {
    name: string;
  };
  types: T;
  primaryType: keyof T;
}

export interface ChallengeSignatureDocument<T extends Eip712Type> {
  type: string;
  eip712Domain: Eip712Domain<T>;
}

// Example of usage:

export type DocumentType = { [k: string]: Eip712Field[] };

export const challengeSignatureDocument: ChallengeSignatureDocument<DocumentType> = {
  type: "EthereumEip712Signature2021",
  eip712Domain: {
    domain: { name: "Passport" },
    types: {
      Document: [
        { type: "string[]", name: "@context" },
        { type: "string[]", name: "type" },
        { type: "string", name: "issuer" },
        { type: "string", name: "issuanceDate" },
        { type: "string", name: "expirationDate" },
        { type: "CredentialSubject", name: "credentialSubject" },
        { type: "Proof", name: "proof" },
      ],
      Context: [
        { type: "string", name: "provider" },
        { type: "string", name: "challenge" },
        { type: "string", name: "address" },
      ],
      EIP712StringArray: [
        { type: "string", name: "provider" },
        { type: "string", name: "challenge" },
        { type: "string", name: "address" },
      ],
      CredentialSubject: [
        { type: "EIP712StringArray[]", name: "@context" },
        { type: "Context[]", name: "context" },
        { type: "string", name: "id" },
        { type: "string", name: "provider" },
        { type: "string", name: "challenge" },
        { type: "string", name: "address" },
      ],
      Proof: [
        { type: "string", name: "@context" },
        { type: "string", name: "created" },
        { type: "string", name: "proofPurpose" },
        { type: "string", name: "type" },
        { type: "string", name: "verificationMethod" },
      ],
    },
    primaryType: "Document",
  },
};

export const stampCredentialDocument: ChallengeSignatureDocument<DocumentType> = {
  type: "EthereumEip712Signature2021",
  eip712Domain: {
    domain: {
      name: "VerifiableCredential",
    },
    types: {
      Document: [
        { name: "@context", type: "string[]" },
        { name: "type", type: "string[]" },
        { name: "issuer", type: "string" },
        { name: "issuanceDate", type: "string" },
        { name: "expirationDate", type: "string" },
        { name: "credentialSubject", type: "CredentialSubject" },
        { name: "proof", type: "Proof" },
        { name: "credentialStatus", type: "CredentialStatus" },
      ],
      CredentialSubject: [
        { name: "id", type: "string" },
        { name: "provider", type: "string" },
        { name: "metaPointer", type: "string" },
        { name: "customInfo", type: "CustomInfo" },
        { name: "hash", type: "string" },
        { name: "@context", type: "Context[]" },
      ],
      Context: [
        { name: "customInfo", type: "string" },
        { name: "hash", type: "string" },
        { name: "metaPointer", type: "string" },
        { name: "provider", type: "string" },
      ],
      CustomInfo: [{ name: "field1", type: "string" }],
      Proof: [
        { name: "@context", type: "string" },
        { name: "type", type: "string" },
        { name: "proofPurpose", type: "string" },
        { name: "proofValue", type: "string" },
        { name: "verificationMethod", type: "string" },
        { name: "created", type: "string" },
      ],
      CredentialStatus: [
        { name: "id", type: "string" },
        { name: "type", type: "string" },
        { name: "statusPurpose", type: "string" },
        { name: "statusListIndex", type: "string" },
        { name: "statusListCredential", type: "string" },
      ],
    },
    primaryType: "Document",
  },
};
