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

export interface DocumentSignatureTypes<T extends Eip712Type> {
  type: string;
  eip712Domain: Eip712Domain<T>;
  verificationMethod: string;
}

// Example of usage:

export type DocumentType = { [k: string]: Eip712Field[] };

export const challengeSignatureDocument = (verificationMethod: string): DocumentSignatureTypes<DocumentType> => ({
  type: "EthereumEip712Signature2021",
  verificationMethod,
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
        { type: "EIP712StringArray", name: "@context" },
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
});

export const stampCredentialDocument = (verificationMethod: string): DocumentSignatureTypes<DocumentType> => ({
  type: "EthereumEip712Signature2021",
  verificationMethod,
  eip712Domain: {
    domain: {
      name: "VerifiableCredential",
    },
    types: {
      EIP712Domain: [
        {
          type: "string",
          name: "name",
        },
      ],
      "@context": [
        {
          type: "string",
          name: "hash",
        },
        {
          type: "string",
          name: "metaPointer",
        },
        {
          type: "string",
          name: "provider",
        },
      ],
      Document: [
        {
          type: "string[]",
          name: "@context",
        },
        {
          type: "CredentialSubject",
          name: "credentialSubject",
        },
        {
          type: "string",
          name: "expirationDate",
        },
        {
          type: "string",
          name: "issuanceDate",
        },
        {
          type: "string",
          name: "issuer",
        },
        {
          type: "Proof",
          name: "proof",
        },
        {
          type: "string[]",
          name: "type",
        },
      ],
      Proof: [
        {
          type: "string",
          name: "@context",
        },
        {
          type: "string",
          name: "created",
        },
        {
          type: "string",
          name: "proofPurpose",
        },
        {
          type: "string",
          name: "type",
        },
        {
          type: "string",
          name: "verificationMethod",
        },
      ],
      CredentialSubject: [
        {
          type: "@context",
          name: "@context",
        },
        {
          type: "string",
          name: "hash",
        },
        {
          type: "string",
          name: "id",
        },
        {
          type: "string",
          name: "metaPointer",
        },
        {
          type: "string",
          name: "provider",
        },
      ],
    },
    primaryType: "Document",
  },
});
