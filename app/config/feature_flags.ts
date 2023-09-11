export type FEATURE_FLAG_TYPE = "FF_CHAIN_SYNC" | "FF_LINEA_ATTESTATIONS";

export let FeatureFlags: Record<FEATURE_FLAG_TYPE, boolean> = {
  FF_CHAIN_SYNC: false,
  FF_LINEA_ATTESTATIONS: false,
};

function configureFeatureFlag(
  queryString: URLSearchParams,
  featureFlag: FEATURE_FLAG_TYPE,
  envVar: string | undefined
) {
  // We want to allow the user to override feature flags in URLs
  const urlValue = queryString.get(featureFlag);

  if (urlValue && ["on", "off"].includes(urlValue)) {
    FeatureFlags[featureFlag] = urlValue === "on";
  } else {
    FeatureFlags[featureFlag] = envVar === "on";
  }
}

export function configureFeatureFlags(queryString: URLSearchParams) {
  // The env var names can't be dynamic due to the way Next.js works
  configureFeatureFlag(queryString, "FF_CHAIN_SYNC", process.env.NEXT_PUBLIC_FF_CHAIN_SYNC);
  configureFeatureFlag(queryString, "FF_LINEA_ATTESTATIONS", process.env.NEXT_PUBLIC_FF_LINEA_ATTESTATIONS);
}
