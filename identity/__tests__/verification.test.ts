import { PassportScore } from "../src/autoVerification";
import { verifyTypes, verifyProvidersAndIssueCredentials, VerifyTypeResult } from "../src/verification";

import { issueHashedCredential } from "../src/credentials";
import { VerifiableCredential, RequestPayload, ProviderContext, IssuedCredential } from "@gitcoin/passport-types";
import { providers } from "@gitcoin/passport-platforms";

jest.mock("../src/credentials");
jest.mock("../src/verification");

jest.mock("../src/bans", () => ({
  checkCredentialBans: jest.fn().mockImplementation((input) => Promise.resolve(input)),
}));

const createMockVerifiableCredential = (provider: string, address: string): VerifiableCredential => ({
  "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/security/suites/eip712sig-2021/v1"],
  type: ["VerifiableCredential", "EVMCredential"],
  credentialSubject: {
    id: `did:pkh:eip155:1:${address}`,
    "@context": {
      hash: "https://schema.org/Text",
      provider: "https://schema.org/Text",
      address: "https://schema.org/Text",
      challenge: "https://schema.org/Text",
      metaPointer: "https://schema.org/URL",
    },
    hash: "0x123456789",
    provider: provider,
    address: address,
    challenge: "test-challenge",
    metaPointer: "https://example.com/metadata",
  },
  issuer: "did:key:test-issuer",
  issuanceDate: new Date().toISOString(),
  expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
  proof: {
    "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
    type: "EthereumEip712Signature2021",
    proofPurpose: "assertionMethod",
    proofValue: "0xabcdef1234567890",
    verificationMethod: "did:key:test-verification",
    created: new Date().toISOString(),
    eip712Domain: {
      domain: {
        name: "GitcoinVerifiableCredential",
      },
      primaryType: "VerifiableCredential",
      types: {
        EIP712Domain: [
          { name: "name", type: "string" },
          { name: "version", type: "string" },
        ],
        VerifiableCredential: [
          { name: "id", type: "string" },
          { name: "address", type: "string" },
        ],
      },
    },
  },
});

function getMockedIssuedCredential(provider: string, address: string): IssuedCredential {
  const credential: IssuedCredential = {
    credential: createMockVerifiableCredential(provider, address),
  };
  return credential;
}

jest.mock("@gitcoin/passport-platforms", () => {
  const originalModule =
    jest.requireActual<typeof import("@gitcoin/passport-platforms")>("@gitcoin/passport-platforms");
  return {
    ...originalModule,
    providers: {
      verify: jest.fn(async (type: string, payload: RequestPayload, context: ProviderContext) => {
        return Promise.resolve({
          valid: true,
          record: { key: "veirfied-condition" },
        });
      }),
    },
  };
});

describe("verifyTypes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call providers.verify for the 'regular' providers in providersByPlatform", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";
    let payload: RequestPayload = {
      version: "v0.0.0",
      address: mockAddress,
      type: "test-type",
      challenge: "test-challenge",
      proofs: {},
    };

    const verifySpy = (providers.verify as jest.Mock).mockImplementation(
      async (provider: string, payload: RequestPayload, context: ProviderContext) => {
        // update the context
        context[`context-${provider}`] = true;
        return Promise.resolve({
          valid: true,
          record: { key: "verified-condition" },
        });
      }
    );

    const issuedCredentials: VerifiableCredential[] = [];
    (issueHashedCredential as jest.Mock).mockImplementation(
      async (DIDKit, currentKey, address, record: { type: string }, expiresInSeconds, signatureType) => {
        const credential = getMockedIssuedCredential(record.type, mockAddress);
        issuedCredentials.push(credential.credential);
        return Promise.resolve(credential);
      }
    );

    const result = await verifyTypes(
      [
        ["provider-1", "provider-2"],
        ["provider-3", "provider-4"],
      ],
      payload
    );

    // Verify the calls to providers.verify
    expect(verifySpy).toHaveBeenCalledTimes(4);
    expect(verifySpy).toHaveBeenCalledWith("provider-1", payload, {
      "context-provider-1": true,
      "context-provider-2": true,
      "context-provider-3": true,
      "context-provider-4": true,
    });
    expect(verifySpy).toHaveBeenCalledWith("provider-2", payload, {
      "context-provider-1": true,
      "context-provider-2": true,
      "context-provider-3": true,
      "context-provider-4": true,
    });
    expect(verifySpy).toHaveBeenCalledWith("provider-3", payload, {
      "context-provider-1": true,
      "context-provider-2": true,
      "context-provider-3": true,
      "context-provider-4": true,
    });
    expect(verifySpy).toHaveBeenCalledWith("provider-4", payload, {
      "context-provider-1": true,
      "context-provider-2": true,
      "context-provider-3": true,
      "context-provider-4": true,
    });

    expect(result.sort((a, b) => (a.type < b.type ? -1 : 1))).toEqual([
      {
        type: "provider-1",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
      {
        type: "provider-2",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
      {
        type: "provider-3",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
      {
        type: "provider-4",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
    ]);
  });

  it("should call providers.verify with proper providers for AllowList#... and DeveloperList#... types", async () => {
    const mockAddress = "0x123";
    let payload: RequestPayload = {
      version: "v0.0.0",
      address: mockAddress,
      type: "test-type",
      challenge: "test-challenge",
    };

    const verifySpy = (providers.verify as jest.Mock).mockImplementation(
      async (provider: string, payload: RequestPayload, context: ProviderContext) => {
        return Promise.resolve({
          valid: true,
          record: { key: "verified-condition" },
        });
      }
    );

    const issuedCredentials: VerifiableCredential[] = [];
    (issueHashedCredential as jest.Mock).mockImplementation(
      async (DIDKit, currentKey, address, record: { type: string }, expiresInSeconds, signatureType) => {
        const credential = getMockedIssuedCredential(record.type, mockAddress);
        issuedCredentials.push(credential.credential);
        return Promise.resolve(credential);
      }
    );

    const result = await verifyTypes(
      [
        ["AllowList#test-1", "AllowList#test-2"],
        ["DeveloperList#test-1#0x1234", "DeveloperList#test-2#0x5678"],
      ],
      payload
    );

    // Verify the calls to providers.verify
    expect(verifySpy).toHaveBeenCalledTimes(4);
    expect(verifySpy).toHaveBeenCalledWith(
      "AllowList",
      {
        ...payload,
        proofs: {
          allowList: "test-1",
        },
      },
      {}
    );
    expect(verifySpy).toHaveBeenCalledWith(
      "AllowList",
      {
        ...payload,
        proofs: {
          allowList: "test-2",
        },
      },
      {}
    );
    expect(verifySpy).toHaveBeenCalledWith(
      "DeveloperList",
      {
        ...payload,
        proofs: {
          conditionName: "test-1",
          conditionHash: "0x1234",
        },
      },
      {}
    );
    expect(verifySpy).toHaveBeenCalledWith(
      "DeveloperList",
      {
        ...payload,
        proofs: {
          conditionName: "test-2",
          conditionHash: "0x5678",
        },
      },
      {}
    );
    expect(result.sort((a, b) => (a.type < b.type ? -1 : 1))).toEqual([
      {
        type: "AllowList#test-1",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
      {
        type: "AllowList#test-2",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
      {
        type: "DeveloperList#test-1#0x1234",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
      {
        type: "DeveloperList#test-2#0x5678",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
    ]);
  });

  it("should return an error if providers.verify throws", async () => {
    const mockAddress = "0x123";
    let payload: RequestPayload = {
      version: "v0.0.0",
      address: mockAddress,
      type: "test-type",
      challenge: "test-challenge",
      proofs: {},
    };

    const verifySpy = (providers.verify as jest.Mock).mockImplementation(
      async (provider: string, payload: RequestPayload, context: ProviderContext) => {
        if (provider === "test-1") {
          throw new Error("Some Error");
        }
        return Promise.resolve({
          valid: true,
          record: { key: "verified-condition" },
        });
      }
    );

    const issuedCredentials: VerifiableCredential[] = [];
    (issueHashedCredential as jest.Mock).mockImplementation(
      async (DIDKit, currentKey, address, record: { type: string }, expiresInSeconds, signatureType) => {
        const credential = getMockedIssuedCredential(record.type, mockAddress);
        issuedCredentials.push(credential.credential);
        return Promise.resolve(credential);
      }
    );

    const result = await verifyTypes([["test-1"], ["test-2"]], payload);

    // Verify the calls to providers.verify
    expect(verifySpy).toHaveBeenCalledTimes(2);
    expect(verifySpy).toHaveBeenCalledWith("test-1", payload, {});
    expect(verifySpy).toHaveBeenCalledWith("test-2", payload, {});
    expect(result.sort((a, b) => (a.type < b.type ? -1 : 1))).toEqual([
      {
        type: "test-1",
        verifyResult: {
          valid: false,
        },
        code: 400,
        error: "Unable to verify provider",
      },
      {
        type: "test-2",
        verifyResult: {
          valid: true,
          record: { key: "verified-condition" },
        },
        error: undefined,
        code: undefined,
      },
    ]);
  });
});

describe("verifyProvidersAndIssueCredentials", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should call verifyTypes and create credentials for each successful verification", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";
    let payload: RequestPayload = {
      version: "v0.0.0",
      address: mockAddress,
      type: "test-type",
      challenge: "test-challenge",
      proofs: {},
    };

    const verifyTypesSpy = (verifyTypes as jest.Mock).mockImplementation(
      async (providersByPlatform: string[][], payload: RequestPayload) => {
        const ret: VerifyTypeResult[] = [];
        providersByPlatform.forEach((providers) => {
          providers.forEach((provider) => {
            ret.push({
              verifyResult: {
                valid: true,
                record: { key: "verified-condition" },
              },
              type: provider,
              code: undefined,
              error: undefined,
            });
          });
        });
        return Promise.resolve({
          valid: true,
          record: { key: "verified-condition" },
        });
      }
    );

    const issuedCredentials: VerifiableCredential[] = [];
    (issueHashedCredential as jest.Mock).mockImplementation(
      async (DIDKit, currentKey, address, record: { type: string }, expiresInSeconds, signatureType) => {
        const credential = getMockedIssuedCredential(record.type, mockAddress);
        issuedCredentials.push(credential.credential);
        return Promise.resolve(credential);
      }
    );

    const result = await verifyProvidersAndIssueCredentials(
      [
        ["provider-1", "provider-2"],
        ["provider-3", "provider-4"],
      ],
      mockAddress,
      payload
    );
  });
});
