import { PlatformSpec, platforms } from "@gitcoin/passport-platforms";
import { useCustomization } from "../hooks/useCustomization";
import { useCallback, useMemo } from "react";
import { CUSTOM_PLATFORM_TYPE_INFO } from "../utils/customizationUtils";

export const usePlatformSpecs = () => {
  const { customStamps } = useCustomization();

  const allPlatforms = useMemo(() => {
    const customPlatforms = Object.values(customStamps || {}).reduce(
      (customPlatforms, { platformType, iconUrl, displayName, description }) => {
        const platformTypeInfo = CUSTOM_PLATFORM_TYPE_INFO[platformType];
        const basePlatformSpecs = platforms[platformTypeInfo.name]?.PlatformDetails;

        customPlatforms[platformTypeInfo.name] = {
          PlatformDetails: {
            platform: platformTypeInfo.name,
            icon: iconUrl || basePlatformSpecs.icon,
            name: displayName || basePlatformSpecs.name,
            description: description || basePlatformSpecs.description,
            connectMessage: basePlatformSpecs.connectMessage,
            isEVM: basePlatformSpecs.isEVM,
          },
        };
        return customPlatforms;
      },
      {} as Record<string, { PlatformDetails: PlatformSpec }>
    );

    return { ...platforms, ...customPlatforms };
  }, [customStamps]);

  const getPlatformSpec = useCallback(
    (platformName: string): PlatformSpec | undefined => {
      return allPlatforms[platformName]?.PlatformDetails;
    },
    [allPlatforms]
  );

  return getPlatformSpec;
};

export const PLATFORMS: PlatformSpec[] = Object.values(platforms).map((platform) => platform.PlatformDetails);
