import { setCustomizationTheme } from "../utils/theme/setCustomizationTheme";
import { Customization, initializeDOMPurify, requestCustomizationConfig } from "../utils/customizationUtils";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";

export const DEFAULT_CUSTOMIZATION_KEY = "none";

const DEFAULT_CUSTOMIZATION: Customization = {
  key: DEFAULT_CUSTOMIZATION_KEY,
  useCustomDashboardPanel: false,
  dashboardPanel: {
    logo: {
      image: null,
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

type Page = "dashboard" | "welcome" | "home";
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

// Don't use this directly, use the CustomizationUrlLayoutRoute component instead
// This is only exported for testing purposes
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
          console.error("Failed to load customization config", e);
          setCustomizationConfig(DEFAULT_CUSTOMIZATION);
        }
      } else {
        setCustomizationConfig(DEFAULT_CUSTOMIZATION);
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
