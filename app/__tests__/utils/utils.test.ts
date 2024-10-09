import { fetchPossibleEVMStamps, getTypesToCheck } from "../../signer/utils";
import { CheckResponseBody, Passport } from "@gitcoin/passport-types";
import { platforms } from "@gitcoin/passport-platforms";
const { Ens, Lens, Github } = platforms;
import axios from "axios";
import { _checkShowOnboard } from "../../utils/helpers";
import { PlatformProps } from "../../components/GenericPlatform";

const mockedAllPlatforms = new Map();
mockedAllPlatforms.set("Ens", {
  platform: new Ens.EnsPlatform(),
  platFormGroupSpec: Ens.ProviderConfig,
});

mockedAllPlatforms.set("Lens", {
  platform: new Lens.LensPlatform(),
  platFormGroupSpec: Lens.ProviderConfig,
});

mockedAllPlatforms.set("Github", {
  platform: new Github.GithubPlatform({
    clientId: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CLIENT_ID,
    redirectUri: process.env.NEXT_PUBLIC_PASSPORT_GITHUB_CALLBACK,
  }),
  platFormGroupSpec: Github.ProviderConfig,
});

describe("fetchPossibleEVMStamps", () => {
  beforeEach(() => {
    jest.spyOn(axios, "post").mockImplementation(async (url, payload): Promise<{ data: CheckResponseBody[] }> => {
      return {
        data: [
          {
            type: "Ens",
            valid: true,
          },
          {
            type: "Lens",
            valid: false,
          },
          {
            type: "Github",
            valid: true,
          },
        ],
      };
    });
  });

  it("should return valid evm platforms", async () => {
    const result = await fetchPossibleEVMStamps("0x123", mockedAllPlatforms, undefined);

    expect(result.length).toBe(1);

    expect(result[0].platformProps.platform.path).toBe("Ens");
  });
  it("should return existing stamps to check", async () => {
    const passport = {
      stamps: [
        {
          provider: "Ens",
        },
      ],
    } as Passport;
    const allPlatformsData = Array.from(mockedAllPlatforms.values());
    const evmPlatforms: PlatformProps[] = allPlatformsData.filter(({ platform }) => platform.isEVM);
    const types = getTypesToCheck(evmPlatforms, passport, true);

    expect(types.length).toBe(2);
    expect(types).toEqual(["Ens", "Lens"]);
  });
});

describe("checkShowOnboard", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns true if onboardTS is not set in localStorage", async () => {
    expect(_checkShowOnboard("")).toBe(true);
  });

  it("returns true if onboardTS is set and older than 3 months", async () => {
    const olderTimestamp = Math.floor(Date.now() / 1000) - 3 * 30 * 24 * 60 * 60 - 1;
    localStorage.setItem("onboardTS", olderTimestamp.toString());
    expect(_checkShowOnboard("")).toBe(true);
  });

  it("returns false if onboardTS is set and within the last 3 months", async () => {
    const recentTimestamp = Math.floor(Date.now() / 1000) - 2 * 30 * 24 * 60 * 60;
    localStorage.setItem("onboardTS", recentTimestamp.toString());
    expect(_checkShowOnboard("")).toBe(false);
  });

  it("returns true if onboardTS is set and exactly 3 months old", async () => {
    const threeMonthsOldTimestamp = Math.floor(Date.now() / 1000) - 3 * 30 * 24 * 60 * 60;
    localStorage.setItem("onboardTS", threeMonthsOldTimestamp.toString());
    expect(_checkShowOnboard("")).toBe(true);
  });

  it("returns true if ONBOARD_RESET_INDEX newly set", async () => {
    const recentTimestamp = Math.floor(Date.now() / 1000) - 2 * 30 * 24 * 60 * 60;
    localStorage.setItem("onboardTS", recentTimestamp.toString());
    expect(_checkShowOnboard("1")).toBe(true);
  });

  it("returns false if ONBOARD_RESET_INDEX set but already processed and re-skipped", async () => {
    const recentTimestamp = Math.floor(Date.now() / 1000) - 2 * 30 * 24 * 60 * 60;
    localStorage.setItem("onboardTS", recentTimestamp.toString());
    expect(_checkShowOnboard("1")).toBe(true);
    localStorage.setItem("onboardTS", recentTimestamp.toString());
    expect(_checkShowOnboard("1")).toBe(false);
  });

  it("returns true if ONBOARD_RESET_INDEX set, re-skipped, then changed again", async () => {
    const recentTimestamp = Math.floor(Date.now() / 1000) - 2 * 30 * 24 * 60 * 60;
    localStorage.setItem("onboardTS", recentTimestamp.toString());
    expect(_checkShowOnboard("1")).toBe(true);
    localStorage.setItem("onboardTS", recentTimestamp.toString());
    expect(_checkShowOnboard("2")).toBe(true);
  });
});
