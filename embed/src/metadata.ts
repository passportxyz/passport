// ---- Types
import { STAMP_PAGES, displayNumber, oAuthPopupUrl } from "./stamps.js";
import { platforms, Provider } from "@gitcoin/passport-platforms";
import { serverUtils } from "./utils/identityHelper.js";
import axios from "axios";

const { ApiError, createHandler } = serverUtils;

// No request body
type MetadataRequestBody = object;

type MetadataResponseBody = {
  header: string;
  platforms: {
    name: string;
    credentials: {
      id: string;
      weight: string;
    }[];
    displayWeight: string;
    icon: string;
    requiresSignature?: boolean;
    requiresPopup?: boolean;
    requiresSDKFlow?: boolean;
  }[];
}[];

// In-memory cache for SVG content
const svgCache = new Map<string, string>();

const getIcon = async (iconPath?: string): Promise<string> => {
  if (!iconPath) return "";

  // Transform relative path to production URL
  // "./assets/githubStampIcon.svg" -> "https://app.passport.xyz/assets/githubStampIcon.svg"
  const fileName = iconPath.replace("./assets/", "");
  const url = `https://app.passport.xyz/assets/${fileName}`;

  // If not an SVG, just return the URL
  if (!url.endsWith(".svg")) {
    return url;
  }

  // Check cache first
  if (svgCache.has(url)) {
    return svgCache.get(url)!;
  }

  // Fetch SVG content
  try {
    const response = await axios.get(url);
    const svgContent = response.data as string;
    svgCache.set(url, svgContent);
    return svgContent;
  } catch {
    // If fetch fails, return URL as fallback
    return url;
  }
};

type CustomSection = {
  title: string;
  order: number;
  items: {
    platform_id: string;
    order: number;
  }[];
};

// ---- Platform definition types ----
type PlatformCredential = { id: string; weight: string };

type PlatformDefinition = {
  platform_id: string;
  icon_platform_id: string;
  name: string;
  description: string;
  is_evm?: boolean;
  documentation_link?: string;
  requires_signature?: boolean;
  requires_popup?: boolean;
  popup_url?: string;
  requires_sdk_flow?: boolean;
  credentials: PlatformCredential[];
};

type EmbedConfigData = {
  weights: { [key: string]: number };
  stamp_sections: CustomSection[];
  platforms?: PlatformDefinition[];
};

export const metadataHandler = createHandler<MetadataRequestBody, MetadataResponseBody>(async (req, res) => {
  const { scorerId } = req.query;
  if (!scorerId) {
    throw new ApiError("Missing required query parameter: `scorerId`", "400_BAD_REQUEST");
  }

  // Get config (weights + stamp sections + platforms) for scorerId
  const configUrl = `${process.env.SCORER_ENDPOINT}/internal/embed/config?community_id=${scorerId as string}`;
  const configResponse = await axios.get(configUrl);
  const configData = configResponse.data as EmbedConfigData;
  const weightsResponseData: { [key: string]: number } = configData.weights;
  const customSections: CustomSection[] = configData.stamp_sections || [];

  // Build lookup maps
  const dynamicPlatformMap = new Map<string, PlatformDefinition>();
  const staticPlatformMap = new Map<string, (typeof STAMP_PAGES)[0]["platforms"][0]>();

  for (const page of STAMP_PAGES) {
    for (const p of page.platforms) {
      staticPlatformMap.set(p.platformId, p);
    }
  }

  for (const pdef of configData.platforms || []) {
    dynamicPlatformMap.set(pdef.platform_id, pdef);
  }

  // Determine section structure
  let sectionsToResolve: { header: string; platformRefs: { platform_id: string; order: number }[] }[];

  if (customSections.length > 0) {
    sectionsToResolve = customSections.map((section) => ({
      header: section.title,
      platformRefs: [...section.items].sort((a, b) => a.order - b.order),
    }));
  } else {
    // Fall back to STAMP_PAGES structure
    sectionsToResolve = STAMP_PAGES.map((page) => ({
      header: page.header,
      platformRefs: page.platforms.map((p, i) => ({ platform_id: p.platformId, order: i })),
    }));
  }

  // Resolve each platform reference
  const updatedStampPages = await Promise.all(
    sectionsToResolve.map(async (section) => ({
      header: section.header,
      platforms: (
        await Promise.all(
          section.platformRefs.map(async (ref) => {
            const customDef = dynamicPlatformMap.get(ref.platform_id);

            if (customDef) {
              // Custom stamp: use PlatformDefinition data
              const iconPlatformData = platforms[customDef.icon_platform_id];
              const icon = iconPlatformData?.PlatformDetails?.icon
                ? await getIcon(iconPlatformData.PlatformDetails.icon)
                : "";

              const credentials = customDef.credentials;
              const totalWeight = credentials.reduce((acc, c) => acc + parseFloat(c.weight), 0);

              return {
                platformId: customDef.platform_id,
                name: customDef.name,
                description: customDef.description,
                documentationLink: customDef.documentation_link || "",
                requiresSignature: customDef.requires_signature,
                requiresPopup: customDef.requires_popup,
                popupUrl: customDef.popup_url || (customDef.requires_popup ? oAuthPopupUrl : undefined),
                requiresSDKFlow: customDef.requires_sdk_flow,
                isEvm: customDef.is_evm,
                icon,
                credentials,
                displayWeight: displayNumber(totalWeight),
              };
            }

            // Standard platform: resolve from STAMP_PAGES + passport-platforms
            const staticDef = staticPlatformMap.get(ref.platform_id);
            const platformId = ref.platform_id;
            const platformData = platforms[platformId];

            if (!platformData || !platformData.providers) {
              return {
                platformId,
                name: staticDef?.name || platformId,
                description: staticDef?.description || "",
                documentationLink: staticDef?.documentationLink || "",
                requiresSignature: staticDef?.requiresSignature,
                requiresPopup: staticDef?.requiresPopup,
                popupUrl: staticDef?.popupUrl,
                requiresSDKFlow: staticDef?.requiresSDKFlow,
                icon: "",
                credentials: [],
                displayWeight: displayNumber(0),
              };
            }

            const icon = await getIcon(platformData.PlatformDetails?.icon);
            const providers: Provider[] = platformData.providers;
            const credentials = providers.map((provider) => ({
              id: provider.type,
              weight: weightsResponseData[provider.type] ? weightsResponseData[provider.type].toString() : "0",
            }));

            return {
              platformId,
              name: staticDef?.name || platformId,
              description: staticDef?.description || "",
              documentationLink: staticDef?.documentationLink || "",
              requiresSignature: staticDef?.requiresSignature,
              requiresPopup: staticDef?.requiresPopup,
              popupUrl: staticDef?.popupUrl,
              requiresSDKFlow: staticDef?.requiresSDKFlow,
              icon,
              credentials,
              displayWeight: displayNumber(credentials.reduce((acc, c) => acc + parseFloat(c.weight), 0)),
            };
          })
        )
      ).filter((platform) => parseFloat(platform.displayWeight) > 0),
    }))
  );

  return void res.json(updatedStampPages);
});
