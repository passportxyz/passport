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

// ---- New unified platform definition types ----
type PlatformCredential = { id: string; weight: string };

type PlatformDefinition = {
  platform_id: string;
  icon_platform_id: string;
  name: string;
  description: string;
  documentation_link?: string;
  requires_signature?: boolean;
  requires_popup?: boolean;
  popup_url?: string;
  requires_sdk_flow?: boolean;
  credentials: PlatformCredential[];
};

// ---- Deprecated: kept for backward compat with old scorer API ----
type CustomStamp = {
  provider_id: string;
  display_name: string;
  description?: string;
  weight: number;
};

type CustomStampsConfig = {
  allow_list_stamps?: CustomStamp[];
  developer_list_stamps?: CustomStamp[];
};

type EmbedConfigData = {
  weights: { [key: string]: number };
  stamp_sections: CustomSection[];
  platforms?: PlatformDefinition[];
  custom_stamps?: CustomStampsConfig;
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
  const platformDefMap = new Map<string, PlatformDefinition>();
  const staticPlatformMap = new Map<string, (typeof STAMP_PAGES)[0]["platforms"][0]>();

  for (const page of STAMP_PAGES) {
    for (const p of page.platforms) {
      staticPlatformMap.set(p.platformId, p);
    }
  }

  // Use new unified `platforms` field if present, otherwise fall back to deprecated `custom_stamps`
  if (configData.platforms !== undefined) {
    // ---- New path: unified platforms array ----
    for (const pdef of configData.platforms) {
      platformDefMap.set(pdef.platform_id, pdef);
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
              const customDef = platformDefMap.get(ref.platform_id);

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
  }

  // ---- Legacy path: deprecated custom_stamps format (backward compat) ----
  const customStamps: CustomStampsConfig = configData.custom_stamps || {};

  const baseSections: {
    header: string;
    platforms: {
      platformId: string;
      name: string;
      description: string;
      documentationLink?: string;
      customCredentials?: { id: string; weight: string }[];
    }[];
  }[] =
    customSections.length > 0
      ? customSections.map((section) => ({
          header: section.title,
          platforms: section.items
            .map((item) => {
              const defaultPlatform = STAMP_PAGES.flatMap((page) => page.platforms).find(
                (p) => p.platformId === item.platform_id
              );

              return (
                defaultPlatform || {
                  platformId: item.platform_id,
                  name: item.platform_id,
                  description: "",
                  documentationLink: "",
                }
              );
            })
            .sort((a, b) => {
              const aOrder = section.items.find((i) => i.platform_id === a.platformId)?.order || 0;
              const bOrder = section.items.find((i) => i.platform_id === b.platformId)?.order || 0;
              return aOrder - bOrder;
            }),
        }))
      : STAMP_PAGES;

  const allowListStamps = customStamps.allow_list_stamps || [];
  const developerListStamps = customStamps.developer_list_stamps || [];

  const sectionsToUse = [
    ...baseSections,
    ...(allowListStamps.length > 0
      ? [
          {
            header: "Guest List",
            platforms: allowListStamps.map((stamp) => ({
              platformId: "AllowList",
              name: stamp.display_name,
              description: stamp.description || "Verify you are part of this community.",
              documentationLink:
                "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-guest-list-stamp",
              customCredentials: [
                {
                  id: stamp.provider_id,
                  weight: String(stamp.weight),
                },
              ],
            })),
          },
        ]
      : []),
    ...(developerListStamps.length > 0
      ? [
          {
            header: "Developer List",
            platforms: developerListStamps.map((stamp) => ({
              platformId: "DeveloperList",
              name: stamp.display_name,
              description: stamp.description || "Verify your GitHub contributions meet the requirements.",
              documentationLink:
                "https://support.passport.xyz/passport-knowledge-base/stamps/how-do-i-add-passport-stamps/the-developer-list-stamp",
              customCredentials: [
                {
                  id: stamp.provider_id,
                  weight: String(stamp.weight),
                },
              ],
            })),
          },
        ]
      : []),
  ];

  const updatedStampPages = await Promise.all(
    sectionsToUse.map(async (stampPage) => ({
      ...stampPage,
      platforms: (
        await Promise.all(
          stampPage.platforms.map(async (platform) => {
            const platformId = platform.platformId;
            const customCreds = "customCredentials" in platform ? platform.customCredentials : undefined;

            if (customCreds && customCreds.length > 0) {
              const platformData = platforms[platformId];
              const icon = platformData?.PlatformDetails?.icon ? await getIcon(platformData.PlatformDetails.icon) : "";
              const credentials = customCreds;
              const totalWeight = credentials.reduce((acc, c) => acc + parseFloat(c.weight), 0);
              const { customCredentials: _omit, ...platformRest } = platform as typeof platform & {
                customCredentials?: { id: string; weight: string }[];
              };
              return {
                ...platformRest,
                icon,
                credentials,
                displayWeight: displayNumber(totalWeight),
              };
            }

            const platformData = platforms[platformId];

            if (!platformData || !platformData.providers) {
              return {
                ...platform,
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
              ...platform,
              icon,
              credentials,
              displayWeight: displayNumber(
                credentials.reduce((acc, credential) => acc + parseFloat(credential.weight), 0)
              ),
            };
          })
        )
      ).filter((platform) => parseFloat(platform.displayWeight) > 0),
    }))
  );
  return void res.json(updatedStampPages);
});
