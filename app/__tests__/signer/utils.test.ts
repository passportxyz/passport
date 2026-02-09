import { describe, it, expect } from "vitest";
import { getTypesToCheck } from "../../signer/utils";
import { PlatformProps } from "../../components/GenericPlatform";
import { PROVIDER_ID } from "@gitcoin/passport-types";

describe("signer/utils", () => {
  describe("getTypesToCheck", () => {
    const createMockPlatformProps = (providers: Array<{ name: PROVIDER_ID; isDeprecated?: boolean }>) =>
      ({
        platFormGroupSpec: [
          {
            platformGroup: "Test Group",
            providers: providers.map((p) => ({
              name: p.name,
              title: `${p.name} Title`,
              description: `${p.name} Description`,
              isDeprecated: p.isDeprecated,
            })),
          },
        ],
        platform: {
          platformId: "TestPlatform",
        },
        isEVM: true,
      }) as unknown as PlatformProps;

    it("should exclude deprecated providers from the check list", () => {
      const evmPlatforms = [
        createMockPlatformProps([
          { name: "ActiveProvider1" as PROVIDER_ID },
          { name: "DeprecatedProvider" as PROVIDER_ID, isDeprecated: true },
          { name: "ActiveProvider2" as PROVIDER_ID },
        ]),
      ];

      const result = getTypesToCheck(evmPlatforms, undefined);

      expect(result).toContain("ActiveProvider1");
      expect(result).toContain("ActiveProvider2");
      expect(result).not.toContain("DeprecatedProvider");
    });

    it("should return empty array when all providers are deprecated", () => {
      const evmPlatforms = [
        createMockPlatformProps([
          { name: "Deprecated1" as PROVIDER_ID, isDeprecated: true },
          { name: "Deprecated2" as PROVIDER_ID, isDeprecated: true },
        ]),
      ];

      const result = getTypesToCheck(evmPlatforms, undefined);

      expect(result).toHaveLength(0);
    });

    it("should still filter existing providers when passport is provided", () => {
      const evmPlatforms = [
        createMockPlatformProps([
          { name: "ActiveProvider1" as PROVIDER_ID },
          { name: "DeprecatedProvider" as PROVIDER_ID, isDeprecated: true },
          { name: "ActiveProvider2" as PROVIDER_ID },
        ]),
      ];

      const passport = {
        stamps: [{ provider: "ActiveProvider1" as PROVIDER_ID }],
      };

      const result = getTypesToCheck(evmPlatforms, passport as any);

      // Should exclude ActiveProvider1 (already in passport) and DeprecatedProvider (deprecated)
      expect(result).not.toContain("ActiveProvider1");
      expect(result).not.toContain("DeprecatedProvider");
      expect(result).toContain("ActiveProvider2");
    });

    it("should include all non-deprecated providers when reIssueStamps is true", () => {
      const evmPlatforms = [
        createMockPlatformProps([
          { name: "ActiveProvider1" as PROVIDER_ID },
          { name: "DeprecatedProvider" as PROVIDER_ID, isDeprecated: true },
          { name: "ActiveProvider2" as PROVIDER_ID },
        ]),
      ];

      const passport = {
        stamps: [{ provider: "ActiveProvider1" as PROVIDER_ID }],
      };

      const result = getTypesToCheck(evmPlatforms, passport as any, true);

      // Should include all non-deprecated even if in passport
      expect(result).toContain("ActiveProvider1");
      expect(result).toContain("ActiveProvider2");
      // But still exclude deprecated
      expect(result).not.toContain("DeprecatedProvider");
    });

    it("should handle multiple platforms with mixed deprecated providers", () => {
      const evmPlatforms = [
        createMockPlatformProps([
          { name: "Platform1Active" as PROVIDER_ID },
          { name: "Platform1Deprecated" as PROVIDER_ID, isDeprecated: true },
        ]),
        createMockPlatformProps([
          { name: "Platform2Active" as PROVIDER_ID },
          { name: "Platform2Deprecated" as PROVIDER_ID, isDeprecated: true },
        ]),
      ];

      const result = getTypesToCheck(evmPlatforms, undefined);

      expect(result).toContain("Platform1Active");
      expect(result).toContain("Platform2Active");
      expect(result).not.toContain("Platform1Deprecated");
      expect(result).not.toContain("Platform2Deprecated");
      expect(result).toHaveLength(2);
    });
  });
});
