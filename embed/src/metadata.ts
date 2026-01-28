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

export const metadataHandler = createHandler<MetadataRequestBody, MetadataResponseBody>(async (req, res) => {
  const { scorerId } = req.query;
  if (!scorerId) {
    throw new ApiError("Missing required query parameter: `scorerId`", "400_BAD_REQUEST");
  }

  // Get config (weights + stamp sections) for scorerId
  const configUrl = `${process.env.SCORER_ENDPOINT}/internal/embed/config?community_id=${scorerId as string}`;
  const configResponse = await axios.get(configUrl);
  const configData = configResponse.data as { weights: { [key: string]: number }; stamp_sections: CustomSection[] };
  const weightsResponseData: { [key: string]: number } = configData.weights;
  const customSections: CustomSection[] = configData.stamp_sections || [];

  // If custom sections exist, use them; otherwise fall back to STAMP_PAGES
  const sectionsToUse =
    customSections.length > 0
      ? customSections.map((section) => ({
          header: section.title,
          platforms: section.items
            .map((item) => {
              // Find the platform in STAMP_PAGES to get its metadata
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
              // Sort by the order defined in items
              const aOrder = section.items.find((i) => i.platform_id === a.platformId)?.order || 0;
              const bOrder = section.items.find((i) => i.platform_id === b.platformId)?.order || 0;
              return aOrder - bOrder;
            }),
        }))
      : STAMP_PAGES;

  // Get providers / credential ids from passport-platforms
  // For each provider, get the weight from the weights response
  const updatedStampPages = await Promise.all(
    sectionsToUse.map(async (stampPage) => ({
      ...stampPage,
      platforms: (
        await Promise.all(
          stampPage.platforms.map(async (platform) => {
            const platformId = platform.platformId;
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
