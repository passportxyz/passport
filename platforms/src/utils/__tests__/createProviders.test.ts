/* eslint-disable */
import { PLATFORM_ID, PROVIDER_ID, ProviderContext, RequestPayload } from "@gitcoin/passport-types";
import { SimpleProvider } from "../simpleProvider";
import { createProviders } from "../createProviders";
import { PlatformConfig } from "platforms";

jest.useFakeTimers(); // Use Jest's timer mocks

const makeSimplePlatforms = ({
  stampIsDeprecated,
}: {
  stampIsDeprecated: boolean;
}): Record<string, PlatformConfig> => ({
  Simple: {
    providers: [new SimpleProvider()],
    PlatformDetails: {
      connectMessage: "",
      description: "",
      enablePlatformCardUpdate: false,
      icon: "",
      isEVM: false,
      name: "Simple",
      platform: "Simple" as PLATFORM_ID,
      website: "",
    },
    ProviderConfig: [
      {
        platformGroup: "Simple",
        providers: [
          {
            title: "Simple",
            name: "Simple" as PROVIDER_ID,
            isDeprecated: stampIsDeprecated,
          },
        ],
      },
    ],
  },
});

describe("createProviders", () => {
  const mockContext: ProviderContext = {};

  const mockPayload: RequestPayload = {
    address: "0x0",
    proofs: {
      username: "test",
      valid: "true",
    },
    type: "Simple",
    version: "",
  };

  test.each([
    {
      stampIsDeprecated: true,
    },
    {
      stampIsDeprecated: false,
    },
  ])("should filter out deprecated providers(deprecated=$stampIsDeprecated)", async ({ stampIsDeprecated }) => {
    const platforms = makeSimplePlatforms({ stampIsDeprecated });
    const providers = createProviders(platforms);

    const result = await providers.verify("Simple", mockPayload, mockContext);

    expect(result.valid).toEqual(!stampIsDeprecated);
    if (stampIsDeprecated) {
      expect(result.errors).toEqual(["Missing provider"]);
    }
  });
});
