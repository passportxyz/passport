import { fetchPossibleEVMStamps } from "../../signer/utils";
import { providers } from "@gitcoin/passport-platforms";
import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { VALID_ENS_VERIFICATION, VALID_LENS_VERIFICATION } from "../../__test-fixtures__/verifiableCredentialResults";
import { Ens, Lens, Github } from "@gitcoin/passport-platforms";
import { checkShowOnboard } from "../../utils/helpers";

const mockedAllPlatforms = new Map();
mockedAllPlatforms.set("Ens", {
  platform: new Ens.EnsPlatform(),
  platFormGroupSpec: Ens.EnsProviderConfig,
});

mockedAllPlatforms.set("Lens", {
  platform: new Lens.LensPlatform(),
  platFormGroupSpec: Lens.LensProviderConfig,
});

mockedAllPlatforms.set("Github", {
  platform: new Github.GithubPlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CALLBACK,
  }),
  platFormGroupSpec: Github.GithubProviderConfig,
});

describe("fetchPossibleEVMStamps", () => {
  beforeEach(() => {
    jest
      .spyOn(providers._providers["Ens"], "verify")
      .mockImplementation(async (payload: RequestPayload): Promise<VerifiedPayload> => {
        return VALID_ENS_VERIFICATION.payload;
      });

    VALID_LENS_VERIFICATION.payload.valid = false;
    jest
      .spyOn(providers._providers["Lens"], "verify")
      .mockImplementation(async (payload: RequestPayload): Promise<VerifiedPayload> => {
        return VALID_LENS_VERIFICATION.payload;
      });
  });
  it("should return valid platforms", async () => {
    const result = await fetchPossibleEVMStamps("0x123", mockedAllPlatforms);

    expect(result.length).toBe(1);

    expect(result[0].platformProps.platform.path).toBe("Ens");
  });
  it("should not include a non evm platform", async () => {
    const github = jest
      .spyOn(providers._providers["Github"], "verify")
      .mockImplementation(async (payload: RequestPayload): Promise<VerifiedPayload> => {
        return {} as VerifiedPayload;
      });
    const result = await fetchPossibleEVMStamps("0x123", mockedAllPlatforms);
    expect(github).not.toHaveBeenCalled();
  });
});

describe("checkShowOnboard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns true if onboardTS is not set in localStorage", () => {
    expect(checkShowOnboard()).toBe(true);
  });

  it("returns true if onboardTS is set and older than 3 months", () => {
    const olderTimestamp = Math.floor(Date.now() / 1000) - 3 * 30 * 24 * 60 * 60 - 1;
    localStorage.setItem("onboardTS", olderTimestamp.toString());
    expect(checkShowOnboard()).toBe(true);
  });

  it("returns false if onboardTS is set and within the last 3 months", () => {
    const recentTimestamp = Math.floor(Date.now() / 1000) - 2 * 30 * 24 * 60 * 60;
    localStorage.setItem("onboardTS", recentTimestamp.toString());
    expect(checkShowOnboard()).toBe(false);
  });

  it("returns true if onboardTS is set and exactly 3 months old", () => {
    const threeMonthsOldTimestamp = Math.floor(Date.now() / 1000) - 3 * 30 * 24 * 60 * 60;
    localStorage.setItem("onboardTS", threeMonthsOldTimestamp.toString());
    expect(checkShowOnboard()).toBe(true);
  });
});
