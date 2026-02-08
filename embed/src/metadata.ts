// ---- Types
import { STAMP_PAGES, displayNumber } from "./stamps.js";
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
  custom_stamps?: CustomStampsConfig;
};

export const metadataHandler = createHandler<MetadataRequestBody, MetadataResponseBody>(async (req, res) => {
  const { scorerId } = req.query;
  if (!scorerId) {
    throw new ApiError("Missing required query parameter: `scorerId`", "400_BAD_REQUEST");
  }

  // Get config (weights + stamp sections + custom stamps) for scorerId
  const configUrl = `${process.env.SCORER_ENDPOINT}/internal/embed/config?community_id=${scorerId as string}`;
  const configResponse = await axios.get(configUrl);
  const configData = configResponse.data as EmbedConfigData;
  const weightsResponseData: { [key: string]: number } = configData.weights;
  const customSections: CustomSection[] = configData.stamp_sections || [];
  const customStamps: CustomStampsConfig = configData.custom_stamps || {};

  // Build base sections from custom sections or STAMP_PAGES
  let sectionsToUse: {
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

  // Append Guest List and Developer List sections when this scorer has custom stamps
  const allowListStamps = customStamps.allow_list_stamps || [];
  const developerListStamps = customStamps.developer_list_stamps || [];
  if (allowListStamps.length > 0) {
    sectionsToUse = [
      ...sectionsToUse,
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
    ];
  }
  if (developerListStamps.length > 0) {
    sectionsToUse = [
      ...sectionsToUse,
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
    ];
  }

  // Get providers / credential ids from passport-platforms (or use customCredentials for Guest List / Developer List)
  const updatedStampPages = await Promise.all(
    sectionsToUse.map(async (stampPage) => ({
      ...stampPage,
      platforms: (
        await Promise.all(
          stampPage.platforms.map(async (platform) => {
            const platformId = platform.platformId;
            const customCreds = "customCredentials" in platform ? platform.customCredentials : undefined;

            if (customCreds && customCreds.length > 0) {
              // Custom stamps (Guest List / Developer List): use provided credentials and icon from platform
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

            // Get icon (SVG content for .svg files, URL for others)
            const icon = await getIcon(platformData.PlatformDetails?.icon);

            // Extract provider types
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
