import { PLATFORM_ID } from "@gitcoin/passport-types";
import { Providers, customStampProviders, getStampProviderIds } from "../../config/providers";
import { Customization } from "../../utils/customizationUtils";
import { Provider } from "ethers";

jest.mock("@gitcoin/passport-platforms", () => ({
  platforms: [],
}));

const STAMP_PROVIDERS = {
  Signer: [
    {
      platformGroup: "Account Name",
      providers: [{ title: "Encrypted", name: "Signer" }],
    },
  ],
};

const CUSTOM_PROVIDERS = {
  AllowList: [{ providers: [{ name: "AllowList#test" }] }],
};

describe("customStampProviders", () => {
  it("returns default providers if customization is undefined", () => {
    const result = customStampProviders();
    expect(result).toMatchObject(STAMP_PROVIDERS);
  });

  it("returns default providers if customization does not have allowListProviders", () => {
    const customization = { otherField: "value" } as unknown as Customization;
    const result = customStampProviders(customization);
    expect(result).toEqual(STAMP_PROVIDERS);
  });

  it("returns custom providers if customization contains allowListProviders", () => {
    const customization = { allowListProviders: CUSTOM_PROVIDERS.AllowList } as unknown as Customization;
    const result = customStampProviders(customization);
    expect(result.AllowList).toEqual(CUSTOM_PROVIDERS.AllowList);
  });
});

describe("getStampProviderIds", () => {
  it("returns an empty array if no providers are available for the given platform", () => {
    const providers = { Signer: [] } as unknown as Providers;
    const result = getStampProviderIds("E" as PLATFORM_ID, providers);
    expect(result).toEqual([]);
  });

  it("returns an array of provider IDs for the given platform", () => {
    const providers = {
      Default: [{ providers: [{ name: "ProviderOne" }, { name: "ProviderTwo" }] }],
    } as unknown as Providers;
    const result = getStampProviderIds("Default" as PLATFORM_ID, providers);
    expect(result).toEqual(["ProviderOne", "ProviderTwo"]);
  });

  it("handles platforms with multiple provider groups", () => {
    const providers = {
      ComplexPlatform: [
        { providers: [{ name: "FirstGroupProvider" }] },
        { providers: [{ name: "SecondGroupProvider" }] },
      ],
    } as unknown as Providers;
    const result = getStampProviderIds("ComplexPlatform" as PLATFORM_ID, providers);
    expect(result).toEqual(["FirstGroupProvider", "SecondGroupProvider"]);
  });
});
