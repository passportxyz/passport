export const definition = {
  models: {
    VerifiableCredentialProof: {
      interface: true,
      implements: [],
      id: "kjzl6hvfrbw6cawb0os86aihrl55fnzkcjm6qtlkye0e7aejpza1da2nz8fkz59",
      accountRelation: { type: "none" },
    },
    GitcoinAttestation: {
      interface: true,
      implements: [],
      id: "kjzl6hvfrbw6c7bdo6avzvlic99m821vqs237lacri5cloqzug5ehhbqwhis1qi",
      accountRelation: { type: "none" },
    },
    VerifiableCredential: {
      interface: true,
      implements: ["kjzl6hvfrbw6c7bdo6avzvlic99m821vqs237lacri5cloqzug5ehhbqwhis1qi"],
      id: "kjzl6hvfrbw6c5knwx7uy240jbynuygpvpbg8aodacpvpdd92524gs2s5diyiqv",
      accountRelation: { type: "none" },
    },
    GitcoinPassportStampWrapperInterface: {
      interface: true,
      implements: [],
      id: "kjzl6hvfrbw6c9ih9lftjjxzzvgcwplzyr7uzp5q78vhyax2or3174abkzsip9x",
      accountRelation: { type: "none" },
    },
    GitcoinPassportStamp: {
      interface: false,
      implements: [
        "kjzl6hvfrbw6c5knwx7uy240jbynuygpvpbg8aodacpvpdd92524gs2s5diyiqv",
        "kjzl6hvfrbw6c7bdo6avzvlic99m821vqs237lacri5cloqzug5ehhbqwhis1qi",
      ],
      id: "kjzl6hvfrbw6c6r0t2b1slwiuz1vqv96ewxgb4xhjqkn9l3gwkuwmmos67xj745",
      accountRelation: { type: "list" },
    },
    GitcoinPassportStampWrapper: {
      interface: false,
      implements: ["kjzl6hvfrbw6c9ih9lftjjxzzvgcwplzyr7uzp5q78vhyax2or3174abkzsip9x"],
      id: "kjzl6hvfrbw6c9lkst4a23zcqualw8mlpy2zybjt25vmy7znjhregy7gek7o8tf",
      accountRelation: { type: "list" },
    },
  },
  objects: {
    VerifiableCredentialProof: { type: { type: "string", required: true } },
    GitcoinAttestation: { type: { type: "list", required: true, item: { type: "string", required: true } } },
    VerifiableCredential: {
      type: { type: "list", required: true, item: { type: "string", required: true } },
      issuer: { type: "string", required: true },
      issuanceDate: { type: "datetime", required: true },
      expirationDate: { type: "datetime", required: false },
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
          model: "kjzl6hvfrbw6c5knwx7uy240jbynuygpvpbg8aodacpvpdd92524gs2s5diyiqv",
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
      Document: {
        type: "list",
        required: false,
        item: { type: "reference", refType: "object", refName: "EIP712ValueType", required: false },
      },
      _context: {
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
      id: { type: "string", required: true },
      hash: { type: "string", required: true },
      _context: {
        type: "reference",
        refType: "object",
        refName: "GitcoinPassportVcCredentialSubjectContext",
        required: false,
      },
      provider: { type: "string", required: true },
    },
    GitcoinPassportStamp: {
      type: { type: "list", required: true, item: { type: "string", required: true } },
      proof: { type: "reference", refType: "object", refName: "GitcoinPassportVcProof", required: true },
      issuer: { type: "string", required: true, indexed: true },
      _context: { type: "list", required: true, item: { type: "string", required: true } },
      issuanceDate: { type: "datetime", required: true, indexed: true },
      expirationDate: { type: "datetime", required: false, indexed: true },
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
          model: "kjzl6hvfrbw6c5knwx7uy240jbynuygpvpbg8aodacpvpdd92524gs2s5diyiqv",
          property: "vcID",
        },
      },
    },
  },
  enums: {},
  accountData: {
    verifiableCredentialProofList: { type: "connection", name: "VerifiableCredentialProof" },
    gitcoinAttestationList: { type: "connection", name: "GitcoinAttestation" },
    verifiableCredentialList: { type: "connection", name: "VerifiableCredential" },
    gitcoinPassportStampWrapperInterfaceList: { type: "connection", name: "GitcoinPassportStampWrapperInterface" },
    gitcoinPassportStampList: { type: "connection", name: "GitcoinPassportStamp" },
    gitcoinPassportStampWrapperList: { type: "connection", name: "GitcoinPassportStampWrapper" },
  },
};
