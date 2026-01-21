import { setCustomizationTheme } from "../utils/theme/setCustomizationTheme";
import {
  Customization,
  initializeDOMPurify,
  requestCustomizationConfig,
  requestBaseCustomizationData,
} from "../utils/customizationUtils";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";

export const DEFAULT_CUSTOMIZATION_KEY = "none";

export const DEFAULT_CUSTOMIZATION: Customization = {
  key: DEFAULT_CUSTOMIZATION_KEY,
  partnerName: "",
  useCustomDashboardPanel: false,
  hideHumnBranding: false,
  dashboardPanel: {
    customDashboardPanelTitle: "",
    logo: {
      image: null,
      background: "dots",
    },
    body: {
      mainText: null,
      subText: null,
      action: {
        text: "",
        url: "",
      },
    },
  },
};
const customizationConfigAtom = atom<Customization>(DEFAULT_CUSTOMIZATION);

// Use as a layout Route element to set the customization key based on the URL
export const CustomizationUrlLayoutRoute = () => {
  const key = useCustomizationKeyFromUrl();
  const setCustomizationKey = useSetCustomizationKey();

  useEffect(() => {
    initializeDOMPurify();
  }, []);

  useEffect(() => {
    setCustomizationKey(key);
  }, [key, setCustomizationKey]);

  return <Outlet />;
};

const useCustomizationKeyFromUrl = (): string | undefined => {
  const { key, customizationKey } = useParams();
  return key ?? customizationKey;
};

type Page = "dashboard" | "welcome" | "home" | `campaign/${string}`;
export const useNavigateToPage = () => {
  const navigate = useNavigate();

  // Need to inspect URL directly or this won't work on page refresh
  const key = useCustomizationKeyFromUrl();

  const navigateToPage = (page: Page) => {
    const path = page === "home" ? "" : page;
    navigate((!key || key === DEFAULT_CUSTOMIZATION_KEY ? "/" : `/${key}/`) + path);
  };

  return navigateToPage;
};

// Generally use the CustomizationUrlLayoutRoute component instead
// This is only exported for testing purposes,or when you need to
// override the customization key in
export const useSetCustomizationKey = (): ((customizationKey: string | undefined) => Promise<void>) => {
  const setCustomizationConfig = useSetAtom(customizationConfigAtom);

  const setCustomizationKey = useCallback(
    async (customizationKey: string | undefined) => {
      if (customizationKey) {
        try {
          const customizationConfig = await requestCustomizationConfig(customizationKey);
          customizationConfig && setCustomizationConfig(customizationConfig);
          customizationConfig?.customizationTheme && setCustomizationTheme(customizationConfig.customizationTheme);
        } catch (e) {
          // If customization doesn't exist (404), fall back to base data
          console.error("Failed to load customization config", e);
          try {
            const { partnerDashboards, betaStamps, featuredCampaigns } = await requestBaseCustomizationData();
            const topNavDashboards = partnerDashboards
              .filter((dashboard) => dashboard.showInTopNav)
              .map((dashboard) => ({
                ...dashboard,
                isCurrent: false,
              }));
            setCustomizationConfig({
              ...DEFAULT_CUSTOMIZATION,
              hideHumnBranding: true,
              partnerDashboards,
              topNavDashboards,
              betaStamps,
              featuredCampaigns,
            });
          } catch {
            setCustomizationConfig({ ...DEFAULT_CUSTOMIZATION, hideHumnBranding: true });
          }
        }
      } else {
        // Fetch partner dashboards, beta stamps, and featured campaigns even when no customization key
        try {
          const { partnerDashboards, betaStamps, featuredCampaigns } = await requestBaseCustomizationData();

          // Pre-filter dashboards for TopNav display (all with isCurrent: false)
          const topNavDashboards = partnerDashboards
            .filter((dashboard) => dashboard.showInTopNav)
            .map((dashboard) => ({
              ...dashboard,
              isCurrent: false, // No dashboard is current when no customization key
            }));

          setCustomizationConfig({
            ...DEFAULT_CUSTOMIZATION,
            partnerDashboards,
            topNavDashboards,
            betaStamps,
            featuredCampaigns,
          });
        } catch (e) {
          console.error("Failed to load base customization data", e);
          setCustomizationConfig(DEFAULT_CUSTOMIZATION);
        }
      }
    },
    [setCustomizationConfig]
  );

  return setCustomizationKey;
};

// This is probably the only thing you should use from this file
export const useCustomization = (): Customization => {
  return useAtomValue(customizationConfigAtom);
};
