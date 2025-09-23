import { autoVerifyStamps, getEvmProvidersByPlatform } from "../src/autoVerification.js";
import { providers } from "@gitcoin/passport-platforms";
import { issueNullifiableCredential } from "../src/credentials.js";
import {
  PROVIDER_ID,
  VerifiableCredential,
  RequestPayload,
  ProviderContext,
  IssuedCredential,
} from "@gitcoin/passport-types";

jest.mock("../src/credentials", () => ({
  issueNullifiableCredential: jest.fn(),
}));

jest.mock("../src/bans", () => ({
  checkCredentialBans: jest.fn().mockImplementation((input) => Promise.resolve(input)),
}));

jest.mock("@gitcoin/passport-platforms", () => ({
  providers: {
    verify: jest.fn(async (_type: string, _payload: RequestPayload, _context: ProviderContext) => {
      return Promise.resolve({
        valid: true,
        record: { key: "verified-condition" },
      });
    }),
  },
  platforms: {
    "provider-ok-1": {
      PlatformDetails: {
        platform: "ETH",
        name: "test 1",
        description: "test 1",
        connectMessage: "test 1",
        isEVM: true,
      },
      ProviderConfig: [
        {
          platformGroup: "Group 1",
          providers: [
            {
              name: "ETHDaysActive#50",
              title: "test-1",
            },
            {
              name: "ETHGasSpent#0.25",
              title: "test-1",
            },
          ],
        },
        {
          platformGroup: "Group 2",
          providers: [
            {
              name: "ETHScore#50",
              title: "test-1",
            },
            {
              name: "ETHScore#75",
              title: "test-1",
            },
            {
              name: "ETHScore#90",
              title: "test-1",
            },
          ],
        },
      ],
    },
    "provider-ok-2": {
      PlatformDetails: {
        platform: "Holonym",
        name: "test 1",
        description: "test 1",
        connectMessage: "test 1",
        isEVM: true,
      },
      ProviderConfig: [
        {
          platformGroup: "Group 1",
          providers: [
            {
              name: "HolonymGovIdProvider",
              title: "test-1",
            },
            {
              name: "HolonymPhone",
              title: "test-1",
            },
          ],
        },
      ],
    },
    "provider-bad-1": {
      PlatformDetails: {
        platform: "Facebook",
        name: "test 1",
        description: "test 1",
        connectMessage: "test 1",
        isEVM: false,
      },
      ProviderConfig: [
        {
          platformGroup: "Group 1",
          providers: [
            {
              name: "Facebook",
              title: "test-1",
            },
            {
              name: "FacebookProfilePicture",
              title: "test-1",
            },
          ],
        },
      ],
    },
    "provider-bad-2": {
      PlatformDetails: {
        platform: "Github",
        name: "test 1",
        description: "test 1",
        connectMessage: "test 1",
        isEVM: false,
      },
      ProviderConfig: [
        {
          platformGroup: "Group 1",
          providers: [
            {
              name: "githubContributionActivityGte#120",
              title: "test-1",
            },
            {
              name: "githubContributionActivityGte#30",
              title: "test-1",
            },
          ],
        },
        {
          platformGroup: "Group 2",
          providers: [
            {
              name: "githubContributionActivityGte#60",
              title: "test-1",
            },
          ],
        },
      ],
    },
  },
}));

jest.mock("ethers", () => ({
  isAddress: jest.fn(() => {
    return true;
  }),
}));

const expectedEvmProvidersToSucceed = new Set<PROVIDER_ID>([
  "ETHDaysActive#50",
  "ETHGasSpent#0.25",
  "ETHScore#50",
  "ETHScore#75",
]);

const expectedEvmProvidersToFail = new Set<PROVIDER_ID>(["ETHScore#90", "HolonymGovIdProvider", "HolonymPhone"]);

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
        "@context": {} as any,
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

describe("autoVerificationHandler", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle valid request successfully", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";

    const verifySpy = (providers.verify as jest.Mock).mockImplementation(
      async (type: string, _payload: RequestPayload, _context: ProviderContext) => {
        if (expectedEvmProvidersToSucceed.has(type as PROVIDER_ID)) {
          return Promise.resolve({
            valid: true,
            record: { key: "verified-condition" },
          });
        } else {
          return Promise.resolve({
            valid: false,
            errors: [`Provider ${type} verification failed`],
          });
        }
      }
    );

    const issuedCredentials: VerifiableCredential[] = [];
    (issueNullifiableCredential as jest.Mock).mockImplementation(async ({ record }) => {
      const credential = getMockedIssuedCredential(record.type, mockAddress);
      issuedCredentials.push(credential.credential);
      return Promise.resolve(credential);
    });

    const result = await autoVerifyStamps({
      address: mockAddress,
      scorerId: mockScorerId,
    });

    // Should have the expected number of successful credentials
    expect(result.credentials).toHaveLength(expectedEvmProvidersToSucceed.size);
    expect(result.credentials).toEqual(issuedCredentials);

    // Should have errors for providers that failed verification
    expect(result.credentialErrors).toHaveLength(expectedEvmProvidersToFail.size);

    expect(verifySpy).toHaveBeenCalledTimes(expectedEvmProvidersToSucceed.size + expectedEvmProvidersToFail.size);
  });

  it("should filter providers if valid request successfully", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";

    const verifySpy = (providers.verify as jest.Mock).mockImplementation(
      async (type: string, _payload: RequestPayload, _context: ProviderContext) => {
        if (expectedEvmProvidersToSucceed.has(type as PROVIDER_ID)) {
          return Promise.resolve({
            valid: true,
            record: { key: "verified-condition" },
          });
        } else {
          return Promise.resolve({
            valid: false,
          });
        }
      }
    );

    const issuedCredentials: VerifiableCredential[] = [];
    (issueNullifiableCredential as jest.Mock).mockImplementation(async ({ record }) => {
      const credential = getMockedIssuedCredential(record.type, mockAddress);
      issuedCredentials.push(credential.credential);
      return Promise.resolve(credential);
    });

    const result = await autoVerifyStamps({
      address: mockAddress,
      scorerId: mockScorerId,
      credentialIds: [
        "ETHDaysActive#50",
        "HolonymPhone",
        "HolonymGovIdProvider",
        "githubContributionActivityGte#120", // not marked as evm
        "githubContributionActivityGte#30", // not marked as evm
      ],
    });
    // Should have 1 credential (ETHDaysActive#50 succeeds) and 2 errors (HolonymPhone and HolonymGovIdProvider fail)
    expect(result.credentials).toHaveLength(1);
    expect(result.credentials).toEqual(issuedCredentials);
    expect(result.credentialErrors).toHaveLength(2);
    expect(verifySpy).toHaveBeenCalledTimes(3); // We only had 3 selected EVM providers
  });

  it("should handle any errors from the embed scorer API correctly", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";

    const verifySpy = (providers.verify as jest.Mock).mockImplementation(
      async (_type: string, _payload: RequestPayload, _context: ProviderContext) => {
        return Promise.resolve({
          valid: true,
          record: { key: "verified-condition" },
        });
      }
    );

    const issuedCredentials: VerifiableCredential[] = [];
    (issueNullifiableCredential as jest.Mock).mockImplementation(async ({ record }) => {
      const credential = getMockedIssuedCredential(record.type, mockAddress);
      issuedCredentials.push(credential.credential);
      return Promise.resolve(credential);
    });

    const result = await autoVerifyStamps({
      address: mockAddress,
      scorerId: mockScorerId,
    });

    expect(result.credentials).toEqual(issuedCredentials);
    expect(result.credentialErrors).toEqual([]);

    expect(verifySpy).toHaveBeenCalledTimes(expectedEvmProvidersToSucceed.size + expectedEvmProvidersToFail.size);
  });

  it("should return credential errors along with successful credentials", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";

    const verifySpy = (providers.verify as jest.Mock).mockImplementation(
      async (type: string, _payload: RequestPayload, _context: ProviderContext) => {
        if (expectedEvmProvidersToSucceed.has(type as PROVIDER_ID)) {
          return Promise.resolve({
            valid: true,
            record: { key: "verified-condition" },
          });
        } else {
          return Promise.resolve({
            valid: false,
            errors: [`Provider ${type} verification failed`],
          });
        }
      }
    );

    const issuedCredentials: VerifiableCredential[] = [];
    (issueNullifiableCredential as jest.Mock).mockImplementation(async ({ record }) => {
      const credential = getMockedIssuedCredential(record.type, mockAddress);
      issuedCredentials.push(credential.credential);
      return Promise.resolve(credential);
    });

    const result = await autoVerifyStamps({
      address: mockAddress,
      scorerId: mockScorerId,
    });

    // Should return both credentials and errors
    expect(result.credentials).toHaveLength(expectedEvmProvidersToSucceed.size);
    expect(result.credentials).toEqual(issuedCredentials);
    expect(result.credentialErrors).toHaveLength(expectedEvmProvidersToFail.size);

    // Check that all errors have the expected structure
    result.credentialErrors.forEach((error) => {
      expect(error).toHaveProperty("provider");
      expect(error).toHaveProperty("error");
      expect(error).toHaveProperty("code");
      expect(error.code).toBe(403);
    });

    expect(verifySpy).toHaveBeenCalledTimes(expectedEvmProvidersToSucceed.size + expectedEvmProvidersToFail.size);
  });

  it("should handle provider exceptions as credential errors", async () => {
    const mockAddress = "0x123";
    const mockScorerId = "test-scorer";

    const verifySpy = (providers.verify as jest.Mock).mockImplementation(
      async (type: string, _payload: RequestPayload, _context: ProviderContext) => {
        if (type === "ETHDaysActive#50") {
          throw new Error("Provider threw an exception");
        }
        return Promise.resolve({
          valid: true,
          record: { key: "verified-condition" },
        });
      }
    );

    (issueNullifiableCredential as jest.Mock).mockImplementation(async ({ record }) => {
      const credential = getMockedIssuedCredential(record.type, mockAddress);
      return Promise.resolve(credential);
    });

    const result = await autoVerifyStamps({
      address: mockAddress,
      scorerId: mockScorerId,
      credentialIds: ["ETHDaysActive#50", "ETHGasSpent#0.25"],
    });

    // Should have one error and one successful credential
    expect(result.credentials).toHaveLength(1);
    expect(result.credentialErrors).toHaveLength(1);
    expect(result.credentialErrors[0]).toEqual({
      provider: "ETHDaysActive#50",
      error: "Unable to verify provider",
      code: 400,
    });
  });
});

describe("getEvmProvidersByPlatform", () => {
  it("should correctly filter returned providers", async () => {
    const providersByPlatform = getEvmProvidersByPlatform({
      scorerId: "123",
      onlyCredentialIds: [
        "ETHDaysActive#50",
        "HolonymPhone",
        "HolonymGovIdProvider",
        "githubContributionActivityGte#120", // not marked as evm
        "githubContributionActivityGte#30", // not marked as evm
      ],
    });
    expect(providersByPlatform).toEqual([["ETHDaysActive#50"], ["HolonymGovIdProvider", "HolonymPhone"]]);
  });
});
