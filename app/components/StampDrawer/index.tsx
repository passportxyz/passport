import React, { useMemo } from "react";
import { Drawer, DrawerOverlay, DrawerContent, DrawerBody } from "@chakra-ui/react";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { DrawerHeader } from "./components/DrawerHeader";
import { DrawerFooter } from "./components/DrawerFooter";
import { CTAButtons } from "./components/CTAButtons";
import { PointsModule } from "./components/PointsModule";
import { CredentialGrid } from "./components/CredentialGrid";
import { StepGuide } from "./components/StepGuide";
import { StampDrawerProps, CredentialGroup, PlatformInfo, VerificationState, StepConfig } from "./types";
import { useBreakpoint } from "../../hooks/useBreakpoint";

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
  platform,
  onVerify,
  verifiedProviders,
  expiredProviders,
  stampWeights,
  stampDedupStatus,
  isLoading = false,
}: StampDrawerProps) => {
  const isLg = useBreakpoint("lg");
  // Process platform data
  const processedData = useMemo(() => {
    // Platform info
    const platformInfo: PlatformInfo = {
      id: platform.id,
      name: platform.name,
      icon: platform.icon,
      description: platform.description,
      cta: platform.cta,
      website: platform.website,
    };

    // Process and group credentials
    const credentialGroups: CredentialGroup[] = platform.credentialGroups
      ? platform.credentialGroups.map((group: any) => ({
          title: group.platformGroup,
          credentials: group.providers.map((provider: any) => {
            const providerId = provider.name as PROVIDER_ID;
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
            };
          }),
        }))
      : [
          {
            title: "Available Stamps",
            credentials: (platform.providers || []).map((provider: any) => {
              const providerId = provider.name as PROVIDER_ID;
              const isVerified = verifiedProviders.includes(providerId);
              const isExpired = expiredProviders.includes(providerId);
              const isDeduplicated = stampDedupStatus?.[providerId] === true;

              const points = stampWeights?.[providerId] ? parseFloat(String(stampWeights[providerId])) : 0;
              const pointsDisplay = isVerified && !isDeduplicated ? `+${points}` : "0";

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
                pointsDisplay,
              };
            }),
          },
        ];

    // Calculate points from all credentials across groups
    const allCredentials = credentialGroups.flatMap((group) => group.credentials);
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
      canSubmit: true, // TODO: Get from actual submit state
      timeToGet: platform.timeToGet,
      price: platform.price,
      pointsGained,
      totalPossiblePoints,
      validityDays: 90, // TODO: Calculate from actual expiry
    };

    // Steps (if any)
    const steps: StepConfig[] = platform.steps || [];

    return {
      platformInfo,
      verificationState,
      credentialGroups,
      steps,
      allStampsVerified,
    };
  }, [platform, verifiedProviders, expiredProviders, stampWeights, stampDedupStatus, isLoading]);

  const { platformInfo, verificationState, credentialGroups, steps, allStampsVerified } = processedData;

  const hasSteps = steps.length > 0;
  const stampGridCols = useStampGridCols({
    hasSteps,
    maxCredentialsInGroup: Math.max(...credentialGroups.map((g) => g.credentials.length)),
    numGroups: credentialGroups.length,
  });
  const drawerSize = useDrawerSize({ hasSteps, stampGridCols });

  // Determine if description/points should stack vertically
  const shouldStack = stampGridCols === 1;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size={drawerSize}>
      <DrawerOverlay />
      <DrawerContent
        style={{
          background: "rgb(var(--color-foreground))",
          border: "1px solid rgb(var(--color-foreground-5))",
          borderRadius: drawerSize === "full" ? "0" : "16px 0 0 16px",
        }}
      >
        <DrawerBody padding="0" display="flex" flexDirection="column" height="100vh" overflow="hidden">
          {["full", "md"].includes(drawerSize) || (hasSteps && !isLg) ? (
            <>
              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto">
                  <div className="p-4">
                    <DrawerHeader
                      icon={platformInfo.icon}
                      name={platformInfo.name}
                      website={platformInfo.website}
                      onClose={onClose}
                    />

                    <div className="mt-4">
                      <PointsModule {...verificationState} />

                      <p className="text-sm text-color-4 mt-6">{platformInfo.description}</p>

                      <CTAButtons
                        platformInfo={platformInfo}
                        verificationState={verificationState}
                        onVerify={onVerify}
                        onClose={onClose}
                      />

                      {hasSteps && <StepGuide steps={steps} isMobile={true} />}

                      <h3 className="text-lg font-semibold text-gray-700 mb-4 mt-8">Stamps</h3>
                      <CredentialGrid credentialGroups={credentialGroups} columns={1} />
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
          ) : hasSteps ? (
            // Desktop with steps - two/three column layout
            <>
              <div className="flex-1 overflow-hidden flex">
                {/* Left Section - Stamps */}
                <div className={`${stampGridCols === 3 ? "w-2/3" : "w-1/2"} flex flex-col h-full`}>
                  <div className="flex-1 overflow-y-auto">
                    <div className="p-4 md:p-6">
                      <DrawerHeader
                        icon={platformInfo.icon}
                        name={platformInfo.name}
                        website={platformInfo.website}
                        onClose={onClose}
                      />

                      <div className="mt-4 md:mt-6">
                        {/* Description/CTA and Points layout */}
                        <div className={`${shouldStack ? "space-y-6" : "flex gap-8 justify-between"} mb-6`}>
                          {/* Description and CTA section */}
                          <div className={`${shouldStack ? "" : "flex-1 min-w-0 max-w-2xl"}`}>
                            <p className="text-base text-color-4 leading-relaxed">{platformInfo.description}</p>
                            <CTAButtons
                              platformInfo={platformInfo}
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
                        <CredentialGrid credentialGroups={credentialGroups} columns={stampGridCols} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Section - Steps */}
                <div className={`${stampGridCols === 3 ? "w-1/3" : "w-1/2"} p-8 overflow-y-auto bg-background`}>
                  <StepGuide steps={steps} />
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
                      icon={platformInfo.icon}
                      name={platformInfo.name}
                      website={platformInfo.website}
                      onClose={onClose}
                    />

                    <div className="mt-4 md:mt-6">
                      {/* Description/CTA and Points layout */}
                      <div className={`${shouldStack ? "space-y-6" : "flex gap-8 justify-between"} mb-6`}>
                        {/* Description and CTA section */}
                        <div className={`${shouldStack ? "" : "flex-1 min-w-0 max-w-2xl"}`}>
                          <p className="text-base text-color-4 leading-relaxed">{platformInfo.description}</p>
                          <CTAButtons
                            platformInfo={platformInfo}
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
                      <CredentialGrid credentialGroups={credentialGroups} columns={stampGridCols} />
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
  );
};

export { StampDrawer };
