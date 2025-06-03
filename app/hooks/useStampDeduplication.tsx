import { useContext, useMemo } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { ScorerContext, PlatformScoreSpec } from "../context/scorerContext";
import { usePlatforms } from "./usePlatforms";

/**
 * Hook to determine if a platform has any stamps that are deduplicated.
 *
 * A stamp is considered deduplicated when:
 * - It's verified (has a credential)
 * - It's marked as dedup in the API response
 * - The platform has 0 earned points
 *
 * @param platform The platform to check for deduplication
 * @returns boolean indicating if the platform has deduplicated stamps
 */
export const useStampDeduplication = (platform: PlatformScoreSpec): boolean => {
  const { allProvidersState } = useContext(CeramicContext);
  const { stampDedupStatus } = useContext(ScorerContext);
  const { platformProviderIds } = usePlatforms();

  return useMemo(() => {
    const providerIds = platformProviderIds[platform.platform] || [];
    return providerIds.some((providerId) => {
      const isVerified = typeof allProvidersState[providerId]?.stamp?.credential !== "undefined";
      const isDeduped = stampDedupStatus?.[providerId] || false;
      const hasZeroPoints = platform.earnedPoints === 0;
      return isVerified && isDeduped && hasZeroPoints;
    });
  }, [platform, allProvidersState, stampDedupStatus, platformProviderIds]);
};
