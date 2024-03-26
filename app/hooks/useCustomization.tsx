import { setCustomizationTheme } from "../utils/theme/setCustomizationTheme";
import { Customization, requestDynamicCustomizationConfig } from "../utils/customizationUtils";
import { atom, useAtomValue, useSetAtom } from "jotai";
import { useCallback, useEffect } from "react";
import { Outlet, useNavigate, useParams } from "react-router-dom";

export const DEFAULT_CUSTOMIZATION_KEY = "none";

const DEFAULT_CUSTOMIZATION: Customization = {
  key: DEFAULT_CUSTOMIZATION_KEY,
  useCustomDashboardPanel: false,
};

const loadConfigForCustomizationKey = async (customizationKey?: string): Promise<Customization> => {
  let config = DEFAULT_CUSTOMIZATION;

  // In the future, no additional "cases" should need to be added here.
  // Customizations should be defined in the backend and loaded dynamically.
  switch (customizationKey) {
    case "testing":
      config = {
        key: "testing",
        useCustomDashboardPanel: true,
        customizationTheme: {
          colors: {
            customizationBackground1: "var(--color-focus)",
            customizationBackground2: "var(--color-focus)",
            customizationForeground1: "var(--color-text-4)",
          },
        },
      };
      break;
    case "verax":
      config = {
        key: "verax",
        useCustomDashboardPanel: true,
        customizationTheme: {
          colors: {
            customizationBackground1: "var(--color-foreground-7)",
            customizationBackground2: "var(--color-foreground-7)",
            customizationForeground1: "var(--color-text-4)",
          },
        },
      };
      break;
    default:
      if (customizationKey) {
        const dynamicConfig = await requestDynamicCustomizationConfig(customizationKey);
        if (dynamicConfig) {
          config = dynamicConfig;
        }
      }
  }

  return config;
};

const customizationConfigAtom = atom<Customization>(DEFAULT_CUSTOMIZATION);

// Use as a layout Route element to set the customization key based on the URL
export const CustomizationUrlLayoutRoute = () => {
  const key = useCustomizationKeyFromUrl();
  const setCustomizationKey = useSetCustomizationKey();

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
    navigate((key === DEFAULT_CUSTOMIZATION_KEY ? "/" : `/${key}/`) + path);
  };

  return navigateToPage;
};

// Don't use this directly, use the CustomizationUrlLayoutRoute component instead
const useSetCustomizationKey = (): ((customizationKey: string | undefined) => Promise<void>) => {
  const setCustomizationConfig = useSetAtom(customizationConfigAtom);

  const setCustomizationKey = useCallback(
    async (customizationKey: string | undefined) => {
      if (customizationKey) {
        const customizationConfig = await loadConfigForCustomizationKey(customizationKey);
        setCustomizationConfig(customizationConfig);
        if (customizationConfig.customizationTheme) {
          setCustomizationTheme(customizationConfig.customizationTheme);
        }
      } else {
        setCustomizationConfig(DEFAULT_CUSTOMIZATION);
      }
    },
    [setCustomizationConfig]
  );

  return setCustomizationKey;
};

export const useCustomization = (): Customization => {
  return useAtomValue(customizationConfigAtom);
};
