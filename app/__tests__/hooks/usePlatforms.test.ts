import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCustomization } from "../../hooks/useCustomization";
import { usePlatforms } from "../../hooks/usePlatforms";

// Mock the useCustomization hook
vi.mock("../../hooks/useCustomization", () => ({
  useCustomization: vi.fn(),
}));

describe("usePlatforms", () => {
  beforeEach(() => {
    // Reset mocks before each test
    (useCustomization as Mock).mockReset();
  });

  it("should return default platforms when no customization is provided", () => {
    (useCustomization as Mock).mockReturnValue({});

    const { result } = renderHook(() => usePlatforms());

    expect(result.current.platforms.size).toBeGreaterThan(0);
    expect(result.current.platforms.has("Ens")).toBeTruthy();
    expect(result.current.platforms.has("Github")).toBeTruthy();
    expect(result.current.platforms.has("Google")).toBeTruthy();
  });

  it("should include AllowList platform when allowListProviders are provided", () => {
    const allowListProviders = [
      {
        platformGroup: "Custom Allow Lists",
        providers: [
          {
            title: "Allow List Provider",
            description: "Check to see if you are on the Guest List.",
            name: "AllowList#Test",
          },
        ],
      },
    ];

    (useCustomization as Mock).mockReturnValue({
      allowListProviders,
    });

    const { result } = renderHook(() => usePlatforms());

    expect(result.current.platforms.has("AllowList")).toBeTruthy();
    expect(result.current.platformGroupSpecs.AllowList).toEqual(allowListProviders);
  });

  it("should include custom stamps when provided", () => {
    (useCustomization as Mock).mockReturnValue({
      customStamps: {
        customPlatform: {
          platformType: "DEVEL",
          banner: { cta: { text: undefined, url: undefined } },
          credentials: [{ providerId: "customProvider", displayName: "Custom Provider", description: "Test" }],
        },
      },
    });

    const { result } = renderHook(() => usePlatforms());

    expect(result.current.platforms.has("Custom#customPlatform")).toBeTruthy();
    expect(result.current.platformGroupSpecs["Custom#customPlatform"]).toBeDefined();
  });

  it("should return correct platform specs", () => {
    (useCustomization as Mock).mockReturnValue({});

    const { result } = renderHook(() => usePlatforms());

    const githubSpec = result.current.getPlatformSpec("Github");
    expect(githubSpec.platform).toBe("Github");
    expect(githubSpec.name).toBeDefined();
    expect(githubSpec.description).toBeDefined();
  });

  it("should return correct platform categories", () => {
    (useCustomization as Mock).mockReturnValue({ partnerName: "TestPartner" });

    const { result } = renderHook(() => usePlatforms());

    const categories = result.current.platformCatagories;
    expect(categories.length).toBeGreaterThan(0);
    expect(categories.find((c) => c.name === "TestPartner Stamps")).toBeDefined();
  });

  it("should return correct platform provider IDs", () => {
    (useCustomization as Mock).mockReturnValue({});

    const { result } = renderHook(() => usePlatforms());

    expect(result.current.platformProviderIds["Github"]).toBeDefined();
    expect(result.current.platformProviderIds["Github"].length).toBeGreaterThan(0);
  });
});
