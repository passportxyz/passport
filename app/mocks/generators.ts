import { VerifiableEip712Credential, Stamp, PROVIDER_ID } from "@gitcoin/passport-types";
import scenarios from "./scenarios.json";

// Generate a unique nullifier based on provider name
export function generateNullifier(provider: string): string {
  const hash = provider.split("").reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
  }, 0);
  return Math.abs(hash).toString(16).padStart(64, "0");
}

// Generate a mock credential
export function generateMockCredential(
  provider: string,
  address: string = "0xDEV123456789ABCDEF123456789ABCDEF123456",
  expirationDate?: string
): VerifiableEip712Credential {
  const issuanceDate = new Date().toISOString();
  const defaultExpirationDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  return {
    "@context": ["https://www.w3.org/2018/credentials/v1", "https://w3id.org/vc/status-list/2021/v1"],
    type: ["VerifiableCredential"],
    credentialSubject: {
      id: `did:pkh:eip155:1:${address.toLowerCase()}`,
      provider,
      nullifiers: [`v0.0.0:${generateNullifier(provider)}`, `v1:${generateNullifier(provider + "v1")}`],
      "@context": {
        nullifiers: {
          "@container": "@list",
          "@type": "https://schema.org/Text",
        },
        provider: "https://schema.org/Text",
      },
    },
    issuer: "did:ethr:0xd6fc34345bc8c8e5659a35bed9629d5558d48c4e",
    issuanceDate,
    expirationDate: expirationDate || defaultExpirationDate,
    proof: {
      "@context": "https://w3id.org/security/suites/eip712sig-2021/v1",
      type: "EthereumEip712Signature2021",
      proofPurpose: "assertionMethod",
      proofValue: "0x" + "a".repeat(130), // Mock signature
      verificationMethod: "did:ethr:0xd6fc34345bc8c8e5659a35bed9629d5558d48c4e#controller",
      created: issuanceDate,
      eip712Domain: {
        domain: {
          name: "VerifiableCredential",
        },
        primaryType: "Document",
        types: {
          "@context": [{ name: "@context", type: "string[]" }],
          Document: [
            { name: "@context", type: "string[]" },
            { name: "type", type: "string[]" },
            { name: "credentialSubject", type: "CredentialSubject" },
            { name: "issuer", type: "string" },
            { name: "issuanceDate", type: "string" },
            { name: "expirationDate", type: "string" },
            { name: "proof", type: "Proof" },
          ],
          CredentialSubject: [
            { name: "id", type: "string" },
            { name: "@context", type: "Context" },
            { name: "provider", type: "string" },
            { name: "nullifiers", type: "string[]" },
          ],
          Context: [
            { name: "nullifiers", type: "NullifiersContext" },
            { name: "provider", type: "string" },
          ],
          NullifiersContext: [
            { name: "@container", type: "string" },
            { name: "@type", type: "string" },
          ],
          Proof: [
            { name: "@context", type: "string" },
            { name: "type", type: "string" },
            { name: "proofPurpose", type: "string" },
            { name: "proofValue", type: "string" },
            { name: "verificationMethod", type: "string" },
            { name: "created", type: "string" },
            { name: "eip712Domain", type: "EIP712Domain" },
          ],
          EIP712Domain: [
            { name: "domain", type: "Domain" },
            { name: "primaryType", type: "string" },
            { name: "types", type: "Types" },
          ],
          Domain: [{ name: "name", type: "string" }],
          Types: [], // Simplified for mock
        },
      },
    },
  };
}

// Generate a mock stamp
export function generateMockStamp(provider: PROVIDER_ID, address?: string, expirationDate?: string): Stamp {
  return {
    provider,
    credential: generateMockCredential(provider, address, expirationDate),
  };
}

// Generate stamps for a scenario
export function generateStampsForScenario(
  scenarioName: keyof typeof scenarios,
  address: string = "0xDEV123456789ABCDEF123456789ABCDEF123456"
): Stamp[] {
  const scenario = scenarios[scenarioName];

  return scenario.stamps.map((stampData: any) => {
    if (typeof stampData === "string") {
      // Simple provider name
      return generateMockStamp(stampData as PROVIDER_ID, address);
    } else {
      // Stamp with custom expiration
      return generateMockStamp(stampData.provider as PROVIDER_ID, address, stampData.expirationDate);
    }
  });
}

// Get the current mock scenario from window
export function getCurrentScenario(): keyof typeof scenarios {
  if (typeof window !== "undefined" && window.__mockScenario) {
    return window.__mockScenario as keyof typeof scenarios;
  }
  return "new-user";
}

// Extend window interface
declare global {
  interface Window {
    __mockScenario?: string;
  }
}
