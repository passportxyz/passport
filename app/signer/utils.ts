// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";

// --- Identity tools
import { CheckResponseBody, Passport, PLATFORM_ID, PROVIDER_ID, VerifiableCredential } from "@gitcoin/passport-types";
import { PlatformProps } from "../components/GenericPlatform";
import { PlatformGroupSpec } from "../config/providers";

import axios from "axios";
import { iamUrl } from "../config/stamp_config";

export type ValidatedProvider = {
  name: PROVIDER_ID;
  title: string;
};

export type ValidatedProviderGroup = {
  providers: ValidatedProvider[];
  name: string;
};

export type ValidatedPlatform = {
  groups: ValidatedProviderGroup[];
  platformProps: PlatformProps;
};

export const getTypesToCheck = (
  evmPlatforms: PlatformProps[],
  passport: Passport | undefined | false,
  reIssueStamps: boolean = false
): PROVIDER_ID[] => {
  const existingProviders = passport && passport.stamps.map((stamp) => stamp.provider);

  const evmProviders: PROVIDER_ID[] = evmPlatforms
    .map(({ platFormGroupSpec }) =>
      platFormGroupSpec.map(({ providers }) =>
        providers.map(({ name }) => {
          if (name.startsWith("AllowList")) {
            return "AllowList";
          }
          return name;
        })
      )
    )
    .flat(2);

  if (existingProviders && !reIssueStamps) {
    return evmProviders.filter((provider) => !existingProviders.includes(provider));
  } else {
    return evmProviders;
  }
};

// These are type-guarded filters which tell typescript that
// objects which pass this filter are of the defined type
const filterUndefined = <T>(item: T | undefined): item is T => !!item;

export const fetchPossibleEVMStamps = async (
  address: string,
  allPlatforms: Map<PLATFORM_ID, PlatformProps>,
  passport: Passport | undefined | false,
  reIssueStamps: boolean = false,
  proofs?: { [k: string]: string }
): Promise<ValidatedPlatform[]> => {
  const allPlatformsData = Array.from(allPlatforms.values());
  const evmPlatforms: PlatformProps[] = allPlatformsData.filter(({ platform }) => platform.isEVM);

  const payload = {
    type: "bulk",
    types: getTypesToCheck(evmPlatforms, passport, reIssueStamps),
    address,
    version: "0.0.0",
    proofs,
  };

  let response: { data: CheckResponseBody[] };
  try {
    response = await axios.post(`${iamUrl.replace(/\/*?$/, "")}/v${payload.version}/check`, {
      payload,
    });
  } catch (e) {
    console.error(e);
    return [];
  }

  const validPlatformIds = response.data.reduce(
    (platforms: string[], { type, valid }) => (valid ? [...platforms, type] : platforms),
    []
  );

  // Define helper functions to filter out invalid providers and groups
  const getValidGroupProviders = (groupSpec: PlatformGroupSpec): ValidatedProvider[] =>
    groupSpec.providers.reduce((providers: ValidatedProvider[], provider) => {
      let { name, title } = provider;
      if (name.startsWith("AllowList")) {
        name = name.split("#")[0] as PROVIDER_ID;
      }
      if (validPlatformIds.includes(name)) return [...providers, { name, title }];
      else return providers;
    }, []);

  const getValidPlatformGroups = (platform: PlatformProps): ValidatedProviderGroup[] =>
    platform.platFormGroupSpec
      .map((groupSpec) => {
        const groupProviders = getValidGroupProviders(groupSpec);
        if (groupProviders.length !== 0)
          return {
            name: groupSpec.platformGroup,
            providers: groupProviders,
          };
      })
      .filter(filterUndefined);

  // Return the platforms with valid groups
  return evmPlatforms
    .map((platform) => {
      const validPlatformGroups = getValidPlatformGroups(platform);
      if (validPlatformGroups.length !== 0)
        return {
          groups: validPlatformGroups,
          platformProps: platform,
        };
    })
    .filter(filterUndefined);
};
