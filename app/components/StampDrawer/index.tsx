import React, { useMemo, useState, useContext } from "react";
import { Drawer, DrawerOverlay, DrawerContent, DrawerBody } from "@chakra-ui/react";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { DrawerHeader } from "./components/DrawerHeader";
import { DrawerFooter } from "./components/DrawerFooter";
import { CTAButtons } from "./components/CTAButtons";
import { PointsModule } from "./components/PointsModule";
import { CredentialGrid } from "./components/CredentialGrid";
import { PlatformGuide } from "./components/PlatformGuide";
import { StampDrawerProps, CredentialGroup, VerificationState } from "./types";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { JsonOutputModal } from "../JsonOutputModal";
import { RemovePlatformModal } from "../RemovePlatformModal";
import { CeramicContext } from "../../context/ceramicContext";
import { POINTED_STAMP_PROVIDER, ScorerContext } from "../../context/scorerContext";
import { useCustomization } from "../../hooks/useCustomization";

const useStampGridCols = ({
  hasSteps,
  maxCredentialsInGroup,
  numGroups,
}: {
  hasSteps: boolean;
  maxCredentialsInGroup: number;
  numGroups: number;
}): 1 | 2 | 3 => {
  const isXl = useBreakpoint("xl");
  const isLg = useBreakpoint("lg");

  if (
    !isLg ||
    (numGroups <= 1 && maxCredentialsInGroup <= 2) || // Single group with 2 or fewer credentials
    (numGroups <= 4 && maxCredentialsInGroup <= 1) // No group with more than 1 credential, 4 or fewer groups
  ) {
    return 1;
  }

  if (isXl) {
    if (hasSteps || (numGroups <= 2 && maxCredentialsInGroup <= 3)) {
      return 2;
    }
    return 3;
  }

  return hasSteps ? 1 : 2;
};

const useDrawerSize = ({
  hasSteps,
  stampGridCols,
}: {
  hasSteps: boolean;
  stampGridCols: 1 | 2 | 3;
}): "full" | "md" | "lg" | "xl" => {
  const isSm = useBreakpoint("sm");

  if (!isSm) return "full";
  if (stampGridCols === 3 || (stampGridCols === 2 && hasSteps)) return "xl";
  if (stampGridCols === 2 || (stampGridCols === 1 && hasSteps)) return "lg";
  return "md";
};

const StampDrawer = ({
  isOpen,
  onClose,
  platformSpec,
  credentialGroups,
  onVerify,
  verifiedProviders,
  expiredProviders,
  stampWeights,
  stampDedupStatus,
  isLoading = false,
}: StampDrawerProps) => {
  const isLg = useBreakpoint("lg");
  const { allProvidersState } = useContext(CeramicContext);
  const { possiblePointsDataForStamps, pointsDataForStamps, pointsData } = useContext(ScorerContext);
  const customization = useCustomization();
  const { betaStamps } = useCustomization();

  // Modal states
  const [jsonModalIsOpen, setJsonModalIsOpen] = useState(false);
  const [removeModalIsOpen, setRemoveModalIsOpen] = useState(false);
  // Process credential groups with runtime data
  const processedData = useMemo(() => {
    // Process and group credentials, filtering out deprecated stamps without earned points
    const processedCredentialGroups: CredentialGroup[] = credentialGroups
      .map((group) => ({
        title: group.platformGroup,
        credentials: group.providers
          .filter((provider) => {
            // Hide deprecated stamps unless user has already verified them
            if (provider.isDeprecated && !verifiedProviders.includes(provider.name)) {
              return false;
            }
            return true;
          })
          .map((provider) => {
            const providerId = provider.name;
            const isVerified = verifiedProviders.includes(providerId);
            const isExpired = expiredProviders.includes(providerId);
            const isDeduplicated = stampDedupStatus?.[providerId] === true;

            const points = stampWeights?.[providerId] ? parseFloat(String(stampWeights[providerId])) : 0;

            const flags: ("expired" | "deduplicated")[] = [];
            if (isExpired) flags.push("expired");
            if (isDeduplicated) flags.push("deduplicated");

            return {
              id: providerId,
              name: provider.title,
              description: provider.description,
              verified: isVerified,
              flags,
              points,
              isEligible: !!pointsData?.is_eligible,
              isBeta: betaStamps?.has(providerId),
            };
          }),
      }))
      // Filter out empty groups (where all providers were deprecated)
      .filter((group) => group.credentials.length > 0);

    // Calculate points from all credentials across groups
    const allCredentials = processedCredentialGroups.flatMap((group) => group.credentials);
    const verifiedCredentials = allCredentials.filter(
      (c) => c.verified && !c.flags.includes("deduplicated") && !c.flags.includes("expired")
    );
    const pointsGained = verifiedCredentials.reduce((sum, c) => sum + c.points, 0);
    const totalPossiblePoints = allCredentials.reduce((sum, c) => sum + c.points, 0);

    // Check if all stamps are verified
    const hasExpiredProviders = allCredentials.some((c) => c.flags.includes("expired"));
    const allStampsVerified =
      allCredentials.length > 0 && allCredentials.every((c) => c.verified) && !hasExpiredProviders;

    // Verification state
    const verificationState: VerificationState = {
      isVerified: verifiedCredentials.length > 0,
      isLoading: isLoading,
      timeToGet: platformSpec.timeToGet,
      price: platformSpec.price,
      pointsGained,
      totalPossiblePoints,
    };

    return {
      verificationState,
      credentialGroups: processedCredentialGroups,
      allStampsVerified,
    };
  }, [
    credentialGroups,
    verifiedProviders,
    expiredProviders,
    stampWeights,
    stampDedupStatus,
    platformSpec,
    isLoading,
    pointsData?.is_eligible,
    pointsDataForStamps,
    possiblePointsDataForStamps,
    customization.scorer?.weights,
  ]);

  const { verificationState, allStampsVerified } = processedData;

  // Compute platform JSON data
  const platformJsonData = useMemo(() => {
    const platformProviderIds = credentialGroups.flatMap((group) => group.providers.map((provider) => provider.name));

    const platformStamps = platformProviderIds
      .map((providerId) => {
        const providerState = allProvidersState?.[providerId];
        const stamp = providerState?.stamp;

        if (!stamp) return null;

        // Find provider metadata
        const providerInfo = credentialGroups.flatMap((group) => group.providers).find((p) => p.name === providerId);

        return {
          provider: providerId,
          credential: stamp.credential,
          name: providerInfo?.title || providerId,
          description: providerInfo?.description || "",
          points: stampWeights?.[providerId] || 0,
          verified: verifiedProviders.includes(providerId),
          expired: expiredProviders.includes(providerId),
          deduplicated: stampDedupStatus?.[providerId] === true,
        };
      })
      .filter(Boolean);

    return {
      platform: platformSpec.name,
      icon: platformSpec.icon,
      description: platformSpec.description,
      stamps: platformStamps,
      totalPossiblePoints: verificationState.totalPossiblePoints,
      pointsGained: verificationState.pointsGained,
    };
  }, [
    credentialGroups,
    allProvidersState,
    stampWeights,
    verifiedProviders,
    expiredProviders,
    stampDedupStatus,
    platformSpec,
    verificationState,
  ]);

  // Get all provider IDs for this platform (for removal)
  const platformProviderIds = useMemo(() => {
    return credentialGroups.flatMap((group) => group.providers.map((provider) => provider.name)) as PROVIDER_ID[];
  }, [credentialGroups]);

  // Handler for viewing platform JSON
  const handleViewPlatformJSON = () => {
    setJsonModalIsOpen(true);
  };

  // Handler for removing all platform stamps
  const handleRemoveAllStamps = () => {
    setRemoveModalIsOpen(true);
  };

  const hasGuide = Boolean(platformSpec.guide && platformSpec.guide.length > 0);
  const stampGridCols = useStampGridCols({
    hasSteps: hasGuide,
    maxCredentialsInGroup: Math.max(...processedData.credentialGroups.map((g) => g.credentials.length)),
    numGroups: processedData.credentialGroups.length,
  });
  const drawerSize = useDrawerSize({ hasSteps: hasGuide, stampGridCols });

  // Determine if description/points should stack vertically
  const shouldStack = stampGridCols === 1;

  return (
    <>
      <Drawer isOpen={isOpen} onClose={onClose} placement="right" size={drawerSize} trapFocus={false}>
        <DrawerOverlay />
        <DrawerContent
          style={{
            background: "rgb(var(--color-foreground))",
            border: "1px solid rgb(var(--color-foreground-5))",
            borderRadius: drawerSize === "full" ? "0" : "16px 0 0 16px",
          }}
        >
          <DrawerBody padding="0" display="flex" flexDirection="column" height="100vh" overflow="hidden">
            {["full", "md"].includes(drawerSize) || (hasGuide && !isLg) ? (
              <>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4">
                      <DrawerHeader
                        icon={platformSpec.icon || ""}
                        name={platformSpec.name}
                        website={platformSpec.website}
                        onClose={onClose}
                        showMenu={verifiedProviders.length > 0}
                        onViewJSON={handleViewPlatformJSON}
                        onRemoveAll={handleRemoveAllStamps}
                      />

                      <div className="mt-4">
                        <PointsModule {...verificationState} />

                        <p className="text-sm text-color-4 mt-6">{platformSpec.description}</p>

                        <CTAButtons
                          platformSpec={platformSpec}
                          verificationState={verificationState}
                          onVerify={onVerify}
                          onClose={onClose}
                        />

                        {hasGuide && platformSpec.guide && (
                          <PlatformGuide sections={platformSpec.guide} isMobile={true} />
                        )}

                        <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-8">Stamps</h3>
                        <CredentialGrid credentialGroups={processedData.credentialGroups} columns={1} />
                      </div>
                    </div>
                  </div>
                </div>

                <DrawerFooter
                  onVerify={onVerify}
                  onClose={onClose}
                  isLoading={verificationState.isLoading}
                  isVerified={allStampsVerified}
                />
              </>
            ) : hasGuide ? (
              // Desktop with guide - two/three column layout
              <>
                <div className="flex-1 overflow-hidden flex">
                  {/* Left Section - Stamps */}
                  <div className={`${stampGridCols === 3 ? "w-2/3" : "w-1/2"} flex flex-col h-full`}>
                    <div className="flex-1 overflow-y-auto">
                      <div className="p-4 md:p-6">
                        <DrawerHeader
                          icon={platformSpec.icon || ""}
                          name={platformSpec.name}
                          website={platformSpec.website}
                          onClose={onClose}
                          showMenu={verifiedProviders.length > 0}
                          onViewJSON={handleViewPlatformJSON}
                          onRemoveAll={handleRemoveAllStamps}
                        />

                        <div className="mt-4 md:mt-6">
                          {/* Description/CTA and Points layout */}
                          <div className={`${shouldStack ? "space-y-6" : "flex gap-8 justify-between"} mb-6`}>
                            {/* Description and CTA section */}
                            <div className={`${shouldStack ? "" : "flex-1 min-w-0 max-w-2xl"}`}>
                              <p className="text-base text-color-4 leading-relaxed">{platformSpec.description}</p>
                              <CTAButtons
                                platformSpec={platformSpec}
                                verificationState={verificationState}
                                onVerify={onVerify}
                                onClose={onClose}
                              />
                            </div>

                            {/* Points module section */}
                            <div className={`${shouldStack ? "" : "flex-shrink-0 w-1/2 max-w-80"}`}>
                              <PointsModule {...verificationState} />
                            </div>
                          </div>

                          {/* Stamps */}
                          <CredentialGrid credentialGroups={processedData.credentialGroups} columns={stampGridCols} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Guide */}
                  <div className={`${stampGridCols === 3 ? "w-1/3" : "w-1/2"} p-8 overflow-y-auto bg-background`}>
                    <PlatformGuide sections={platformSpec.guide!} />
                  </div>
                </div>

                <DrawerFooter
                  onVerify={onVerify}
                  onClose={onClose}
                  isLoading={verificationState.isLoading}
                  isVerified={allStampsVerified}
                />
              </>
            ) : (
              <>
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-6">
                      <DrawerHeader
                        icon={platformSpec.icon || ""}
                        name={platformSpec.name}
                        website={platformSpec.website}
                        onClose={onClose}
                        showMenu={verifiedProviders.length > 0}
                        onViewJSON={handleViewPlatformJSON}
                        onRemoveAll={handleRemoveAllStamps}
                      />

                      <div className="mt-4 md:mt-6">
                        {/* Description/CTA and Points layout */}
                        <div className={`${shouldStack ? "space-y-6" : "flex gap-8 justify-between"} mb-6`}>
                          {/* Description and CTA section */}
                          <div className={`${shouldStack ? "" : "flex-1 min-w-0 max-w-2xl"}`}>
                            <p className="text-base text-color-4 leading-relaxed">{platformSpec.description}</p>
                            <CTAButtons
                              platformSpec={platformSpec}
                              verificationState={verificationState}
                              onVerify={onVerify}
                              onClose={onClose}
                            />
                          </div>

                          {/* Points module section */}
                          <div className={`${shouldStack ? "" : "flex-shrink-0 w-1/2 max-w-80"}`}>
                            <PointsModule {...verificationState} />
                          </div>
                        </div>

                        {/* Stamps */}
                        <CredentialGrid credentialGroups={processedData.credentialGroups} columns={stampGridCols} />
                      </div>
                    </div>
                  </div>
                </div>

                <DrawerFooter
                  onVerify={onVerify}
                  onClose={onClose}
                  isLoading={verificationState.isLoading}
                  isVerified={allStampsVerified}
                />
              </>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      <JsonOutputModal
        isOpen={jsonModalIsOpen}
        onClose={() => setJsonModalIsOpen(false)}
        title="Platform Details"
        subheading="Platform and stamp verification data"
        jsonOutput={platformJsonData}
      />

      <RemovePlatformModal
        isOpen={removeModalIsOpen}
        onClose={() => setRemoveModalIsOpen(false)}
        providerIds={platformProviderIds}
        platformName={platformSpec.name}
        onComplete={onClose}
      />
    </>
  );
};

export { StampDrawer };
