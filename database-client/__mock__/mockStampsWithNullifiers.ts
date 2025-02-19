import { Stamp, StampPatch } from "@gitcoin/passport-types";

const mockedStamps: Stamp[] = [
  {
    provider: "GitcoinContributorStatistics#totalContributionAmountGte#10",
    credential: {
      type: ["VerifiableCredential"],
      proof: {
        type: "EthereumEip712Signature2021",
        created: "2024-01-18T15:20:18.055Z",
        "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
        proofValue:
          "0xcd009c8caabd5549c0d20ce729271a10324c3c316972af5a715f801f387fefe76fbdcd657078d84a87fd452dbada03acfa2ce3e6efb829c086b31edeca4d54ae1b",
        eip712Domain: {
          types: {
            Proof: [
              {
                name: "@context",
                type: "string",
              },
              {
                name: "created",
                type: "string",
              },
              {
                name: "proofPurpose",
                type: "string",
              },
              {
                name: "type",
                type: "string",
              },
              {
                name: "verificationMethod",
                type: "string",
              },
            ],
            "@context": [
              {
                name: "nullifiers",
                type: "NullifiersContext",
              },
              {
                name: "provider",
                type: "string",
              },
            ],
            Document: [
              {
                name: "@context",
                type: "string[]",
              },
              {
                name: "credentialSubject",
                type: "CredentialSubject",
              },
              {
                name: "expirationDate",
                type: "string",
              },
              {
                name: "issuanceDate",
                type: "string",
              },
              {
                name: "issuer",
                type: "string",
              },
              {
                name: "proof",
                type: "Proof",
              },
              {
                name: "type",
                type: "string[]",
              },
            ],
            EIP712Domain: [
              {
                name: "name",
                type: "string",
              },
            ],
            CredentialSubject: [
              {
                name: "@context",
                type: "@context",
              },
              {
                name: "nullifiers",
                type: "string[]",
              },
              {
                name: "id",
                type: "string",
              },
              {
                name: "provider",
                type: "string",
              },
            ],
            NullifiersContext: [
              {
                name: "@container",
                type: "string",
              },
              {
                name: "@type",
                type: "string",
              },
            ],
          },
          domain: {
            name: "VerifiableCredential",
          },
          primaryType: "Document",
        },
        proofPurpose: "assertionMethod",
        verificationMethod: "did:ethr:0xd6fc34345bc8c8e5659a35bed9629d5558d48c4e#controller",
      },
      issuer: "did:ethr:0xd6fc34345bc8c8e5659a35bed9629d5558d48c4e",
      "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/vc/status-list/2021/v1"],
      issuanceDate: "2024-01-18T15:20:18.055Z",
      expirationDate: "2024-04-17T14:20:18.055Z",
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0636F974D29d947d4946b2091d769ec6D2d415DE",
        nullifiers: ["v1:ABCDEFGHIJK", "v2:LMNOPQRSTUVW"],
        "@context": {
          nullifiers: {
            "@type": "https://schema.org/Text",
            "@container": "@list",
          },
          provider: "https://schema.org/Text",
        },
        provider: "GitcoinContributorStatistics#totalContributionAmountGte#10",
      },
    },
  },
  {
    provider: "FirstEthTxnProvider",
    credential: {
      type: ["VerifiableCredential"],
      proof: {
        type: "EthereumEip712Signature2021",
        created: "2024-01-16T23:18:51.642Z",
        "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
        proofValue:
          "0x03734141dea4015030cfefc6bdfb4eb6d401a7db9bc28a1246492e5382a0854a4d8335b06ee515f96f208fbcf0c0d3e5132ef3b7f4c912dc4e2bc2931f29b01c1c",
        eip712Domain: {
          types: {
            Proof: [
              {
                name: "@context",
                type: "string",
              },
              {
                name: "created",
                type: "string",
              },
              {
                name: "proofPurpose",
                type: "string",
              },
              {
                name: "type",
                type: "string",
              },
              {
                name: "verificationMethod",
                type: "string",
              },
            ],
            "@context": [
              {
                name: "nullifiers",
                type: "NullifiersContext",
              },
              {
                name: "provider",
                type: "string",
              },
            ],
            Document: [
              {
                name: "@context",
                type: "string[]",
              },
              {
                name: "credentialSubject",
                type: "CredentialSubject",
              },
              {
                name: "expirationDate",
                type: "string",
              },
              {
                name: "issuanceDate",
                type: "string",
              },
              {
                name: "issuer",
                type: "string",
              },
              {
                name: "proof",
                type: "Proof",
              },
              {
                name: "type",
                type: "string[]",
              },
            ],
            EIP712Domain: [
              {
                name: "name",
                type: "string",
              },
            ],
            CredentialSubject: [
              {
                name: "@context",
                type: "@context",
              },
              {
                name: "nullifiers",
                type: "string[]",
              },
              {
                name: "id",
                type: "string",
              },
              {
                name: "provider",
                type: "string",
              },
            ],
            NullifiersContext: [
              {
                name: "@container",
                type: "string",
              },
              {
                name: "@type",
                type: "string",
              },
            ],
          },
          domain: {
            name: "VerifiableCredential",
          },
          primaryType: "Document",
        },
        proofPurpose: "assertionMethod",
        verificationMethod: "did:ethr:0xd6fc34345bc8c8e5659a35bed9629d5558d48c4e#controller",
      },
      issuer: "did:ethr:0xd6fc34345bc8c8e5659a35bed9629d5558d48c4e",
      "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/vc/status-list/2021/v1"],
      issuanceDate: "2024-01-16T23:18:51.641Z",
      expirationDate: "2024-04-15T22:18:51.641Z",
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0636F974D29d947d4946b2091d769ec6D2d415DE",
        nullifiers: [
          "v0.0.0:VC1vOVLxD3X29DYfyyT58AA+j0rC5vkXNflCA94iApA=",
          "v2:f2xNM0MREBA7quoh/2UyVFWYIvy42lGTIw+oFxblxng=",
        ],
        provider: "FirstEthTxnProvider",
        "@context": {
          nullifiers: {
            "@type": "https://schema.org/Text",
            "@container": "@list",
          },
          provider: "https://schema.org/Text",
        },
      },
    },
  },
  {
    provider: "EthGTEOneTxnProvider",
    credential: {
      type: ["VerifiableCredential"],
      proof: {
        type: "EthereumEip712Signature2021",
        created: "2024-01-16T23:18:51.642Z",
        "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
        proofValue:
          "0x16619606b1d7d07ef2dc05d1d47e209451f0db323d1685f2355583b14a4526923916746d379211f5bd0759304a495cc2fe6c5dcdfde51f0931d0364e6018e5c41b",
        eip712Domain: {
          types: {
            Proof: [
              {
                name: "@context",
                type: "string",
              },
              {
                name: "created",
                type: "string",
              },
              {
                name: "proofPurpose",
                type: "string",
              },
              {
                name: "type",
                type: "string",
              },
              {
                name: "verificationMethod",
                type: "string",
              },
            ],
            "@context": [
              {
                name: "nullifiers",
                type: "NullifiersContext",
              },
              {
                name: "provider",
                type: "string",
              },
            ],
            Document: [
              {
                name: "@context",
                type: "string[]",
              },
              {
                name: "credentialSubject",
                type: "CredentialSubject",
              },
              {
                name: "expirationDate",
                type: "string",
              },
              {
                name: "issuanceDate",
                type: "string",
              },
              {
                name: "issuer",
                type: "string",
              },
              {
                name: "proof",
                type: "Proof",
              },
              {
                name: "type",
                type: "string[]",
              },
            ],
            EIP712Domain: [
              {
                name: "name",
                type: "string",
              },
            ],
            CredentialSubject: [
              {
                name: "@context",
                type: "@context",
              },
              {
                name: "hash",
                type: "string",
              },
              {
                name: "id",
                type: "string",
              },
              {
                name: "provider",
                type: "string",
              },
            ],
            NullifiersContext: [
              {
                name: "@container",
                type: "string",
              },
              {
                name: "@type",
                type: "string",
              },
            ],
          },
          domain: {
            name: "VerifiableCredential",
          },
          primaryType: "Document",
        },
        proofPurpose: "assertionMethod",
        verificationMethod: "did:ethr:0xd6fc34345bc8c8e5659a35bed9629d5558d48c4e#controller",
      },
      issuer: "did:ethr:0xd6fc34345bc8c8e5659a35bed9629d5558d48c4e",
      "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/vc/status-list/2021/v1"],
      issuanceDate: "2024-01-16T23:18:51.641Z",
      expirationDate: "2024-04-15T22:18:51.641Z",
      credentialSubject: {
        id: "did:pkh:eip155:1:0x0636F974D29d947d4946b2091d769ec6D2d415DE",
        provider: "EthGTEOneTxnProvider",
        nullifiers: ["v0.0.0:Oea3wZ4eyz1+5XeCOJo+flx2vSlE9PiZcL9HZeQda44=", "v2:abcdefghijklmnopqrstuvwxyz"],
        "@context": {
          provider: "https://schema.org/Text",
          nullifiers: {
            "@type": "https://schema.org/Text",
            "@container": "@list",
          },
        },
      },
    },
  },
];

export default mockedStamps;