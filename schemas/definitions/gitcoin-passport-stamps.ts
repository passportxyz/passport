// This is an auto-generated file, do not edit manually
import type { RuntimeCompositeDefinition } from "@composedb/types";
export const definition: RuntimeCompositeDefinition = {
  models: {
    GitcoinAttestation: {
      interface: true,
      implements: [],
      id: "kjzl6hvfrbw6c7bdo6avzvlic99m821vqs237lacri5cloqzug5ehhbqwhis1qi",
      accountRelation: { type: "none" },
    },
    VerifiableCredentialSubject: {
      interface: true,
      implements: [],
      id: "kjzl6hvfrbw6canjsg9rz6ggka52reuwpau0ocz3hmda8wi0b0ti8pn7p037sq3",
      accountRelation: { type: "none" },
    },
    VerifiableCredentialProof: {
      interface: true,
      implements: [],
      id: "kjzl6hvfrbw6cawb0os86aihrl55fnzkcjm6qtlkye0e7aejpza1da2nz8fkz59",
      accountRelation: { type: "none" },
    },
    VerifiableCredential: {
      interface: true,
      implements: ["kjzl6hvfrbw6c7bdo6avzvlic99m821vqs237lacri5cloqzug5ehhbqwhis1qi"],
      id: "kjzl6hvfrbw6ca3q5r1rh58vf4f5umpwqovyyegbl6y5pxfw08g1bcu70l148bc",
      accountRelation: { type: "none" },
    },
    GitcoinPassportStampWrapperInterface: {
      interface: true,
      implements: [],
      id: "kjzl6hvfrbw6cbd0ycro86puamc46xfzm7bun5nh3ji8hgv4n56a21ssmeu7m1t",
      accountRelation: { type: "none" },
    },
    GitcoinPassportStamp: {
      interface: false,
      implements: [
        "kjzl6hvfrbw6ca3q5r1rh58vf4f5umpwqovyyegbl6y5pxfw08g1bcu70l148bc",
        "kjzl6hvfrbw6c7bdo6avzvlic99m821vqs237lacri5cloqzug5ehhbqwhis1qi",
      ],
      id: "kjzl6hvfrbw6c8v5k4ga4eyw4kpem3kfm090clhjnn6a64jmrozagjumvov7k2a",
      accountRelation: { type: "list" },
    },
    GitcoinPassportStampWrapper: {
      interface: false,
      implements: ["kjzl6hvfrbw6cbd0ycro86puamc46xfzm7bun5nh3ji8hgv4n56a21ssmeu7m1t"],
      id: "kjzl6hvfrbw6c54frslemp7s17zp7v2323eesfwtplwr6r4pe482wedrpuk1817",
      accountRelation: { type: "list" },
    },
  },
  objects: {
    GitcoinAttestation: { type: { type: "list", required: true, item: { type: "string", required: true } } },
    VerifiableCredentialSubject: { _id: { type: "string", required: true } },
    VerifiableCredentialProof: { type: { type: "string", required: true } },
    VerifiableCredential: {
      type: { type: "list", required: true, item: { type: "string", required: true } },
      issuer: { type: "string", required: true },
      issuanceDate: { type: "datetime", required: true },
      expirationDate: { type: "datetime", required: true },
    },
    GitcoinPassportStampWrapperInterface: {
      vcID: { type: "streamid", required: true },
      isDeleted: { type: "boolean", required: false },
      isRevoked: { type: "boolean", required: false },
      vc: {
        type: "view",
        viewType: "relation",
        relation: {
          source: "document",
          model: "kjzl6hvfrbw6ca3q5r1rh58vf4f5umpwqovyyegbl6y5pxfw08g1bcu70l148bc",
          property: "vcID",
        },
      },
    },
    EIP712ValueType: { name: { type: "string", required: true }, type: { type: "string", required: true } },
    EIP712DomainTypes: {
      Proof: {
        type: "list",
        required: false,
        item: { type: "reference", refType: "object", refName: "EIP712ValueType", required: false },
      },
      Context: {
        type: "list",
        required: false,
        item: { type: "reference", refType: "object", refName: "EIP712ValueType", required: false },
      },
      Document: {
        type: "list",
        required: false,
        item: { type: "reference", refType: "object", refName: "EIP712ValueType", required: false },
      },
      EIP712Domain: {
        type: "list",
        required: false,
        item: { type: "reference", refType: "object", refName: "EIP712ValueType", required: false },
      },
      CredentialStatus: {
        type: "list",
        required: false,
        item: { type: "reference", refType: "object", refName: "EIP712ValueType", required: false },
      },
      CredentialSubject: {
        type: "list",
        required: false,
        item: { type: "reference", refType: "object", refName: "EIP712ValueType", required: false },
      },
    },
    EIP712DomainDomain: { name: { type: "string", required: true } },
    EIP712Domain: {
      types: { type: "reference", refType: "object", refName: "EIP712DomainTypes", required: true },
      domain: { type: "reference", refType: "object", refName: "EIP712DomainDomain", required: true },
      primaryType: { type: "string", required: true },
    },
    GitcoinPassportVcProof: {
      type: { type: "string", required: true },
      created: { type: "datetime", required: true },
      _context: { type: "string", required: true },
      proofValue: { type: "string", required: true },
      eip712Domain: { type: "reference", refType: "object", refName: "EIP712Domain", required: true },
      proofPurpose: { type: "string", required: true },
      verificationMethod: { type: "string", required: true },
    },
    GitcoinPassportVcCredentialSubjectContext: {
      hash: { type: "string", required: true },
      provider: { type: "string", required: true },
    },
    GitcoinPassportVcCredentialSubject: {
      _id: { type: "string", required: true },
      hash: { type: "string", required: true },
      _context: {
        type: "reference",
        refType: "object",
        refName: "GitcoinPassportVcCredentialSubjectContext",
        required: true,
      },
      provider: { type: "string", required: true },
    },
    GitcoinPassportStamp: {
      type: { type: "list", required: true, item: { type: "string", required: true } },
      proof: { type: "reference", refType: "object", refName: "GitcoinPassportVcProof", required: true },
      issuer: { type: "string", required: true, indexed: true },
      _context: { type: "list", required: true, item: { type: "string", required: true } },
      issuanceDate: { type: "datetime", required: true, indexed: true },
      expirationDate: { type: "datetime", required: true, indexed: true },
      credentialSubject: {
        type: "reference",
        refType: "object",
        refName: "GitcoinPassportVcCredentialSubject",
        required: true,
      },
    },
    GitcoinPassportStampWrapper: {
      vcID: { type: "streamid", required: true, indexed: true },
      isDeleted: { type: "boolean", required: false, indexed: true },
      isRevoked: { type: "boolean", required: false, indexed: true },
      vc: {
        type: "view",
        viewType: "relation",
        relation: {
          source: "document",
          model: "kjzl6hvfrbw6ca3q5r1rh58vf4f5umpwqovyyegbl6y5pxfw08g1bcu70l148bc",
          property: "vcID",
        },
      },
    },
  },
  enums: {},
  accountData: {
    gitcoinAttestationList: { type: "connection", name: "GitcoinAttestation" },
    verifiableCredentialSubjectList: { type: "connection", name: "VerifiableCredentialSubject" },
    verifiableCredentialProofList: { type: "connection", name: "VerifiableCredentialProof" },
    verifiableCredentialList: { type: "connection", name: "VerifiableCredential" },
    gitcoinPassportStampWrapperInterfaceList: { type: "connection", name: "GitcoinPassportStampWrapperInterface" },
    gitcoinPassportStampList: { type: "connection", name: "GitcoinPassportStamp" },
    gitcoinPassportStampWrapperList: { type: "connection", name: "GitcoinPassportStampWrapper" },
  },
};
