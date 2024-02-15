import React, { useEffect, useMemo, useState } from "react";
import { setCustomizationTheme } from "../utils/theme/setCustomizationTheme";
import { Customization, requestDynamicCustomizationConfig } from "../utils/customizationUtils";

type CustomizationHookValues = {
  customizationEnabled: boolean;
  customizationConfig: Customization;
};

const loadConfigForCustomizationKey = async (customizationKey?: string): Promise<CustomizationHookValues> => {
  let customizationEnabled = false;

  let config: Customization = {
    useCustomDashboardPanel: false,
  };

  // In the future, no additional "cases" should need to be added here.
  // Customizations should be defined in the backend and loaded dynamically.
  switch (customizationKey) {
    case "testing":
      customizationEnabled = true;
      config = {
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
      customizationEnabled = true;
      config = {
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
          customizationEnabled = true;
          config = dynamicConfig;
        }
      }
  }

  return {
    customizationEnabled,
    customizationConfig: config,
  };
};

export const useDashboardCustomization = (customizationKey?: string): CustomizationHookValues => {
  const [customizationEnabled, setCustomizationEnabled] = useState(false);
  const [customizationConfig, setCustomizationConfig] = useState<Customization>({
    useCustomDashboardPanel: false,
  });

  useEffect(() => {
    (async () => {
      if (customizationKey) {
        const { customizationConfig, customizationEnabled } = await loadConfigForCustomizationKey(customizationKey);
        setCustomizationConfig(customizationConfig);
        setCustomizationEnabled(customizationEnabled);
        if (customizationConfig.customizationTheme) {
          setCustomizationTheme(customizationConfig.customizationTheme);
        }
      } else {
        setCustomizationEnabled(false);
      }
    })();
  }, [customizationKey]);

  const values = useMemo(
    () => ({
      customizationEnabled,
      customizationConfig,
    }),
    [customizationEnabled, customizationConfig]
  );

  return values;
};
