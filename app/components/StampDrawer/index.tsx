import React, { useMemo } from "react";
import { Drawer, DrawerOverlay, DrawerContent, DrawerBody } from "@chakra-ui/react";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { DrawerHeader } from "./components/DrawerHeader";
import { DrawerFooter } from "./components/DrawerFooter";
import { CTAButtons } from "./components/CTAButtons";
import { PointsModule } from "./components/PointsModule";
import { CredentialGrid } from "./components/CredentialGrid";
import { StepGuide } from "./components/StepGuide";
import { useViewport } from "./hooks/useViewport";
import { StampDrawerProps, Credential, CredentialGroup, PlatformInfo, VerificationState, StepConfig } from "./types";

// Helper to determine how many columns the stamp grid should have
const getStampGridCols = (isMobile: boolean, isWide: boolean, hasSteps: boolean): 1 | 2 | 3 => {
  if (isMobile) return 1;
  if (isWide && hasSteps) return 2; // With steps, stamps get 2 columns max
  if (isWide) return 3; // Without steps, stamps can use 3 columns
  return hasSteps ? 1 : 2; // Medium desktop
};

const StampDrawer = ({
  isOpen,
  onClose,
  platform,
  onVerify,
  onUpdateScore,
  verifiedProviders,
  expiredProviders,
  stampWeights,
  stampDedupStatus,
}: StampDrawerProps) => {
  const { isMobile, isWide } = useViewport();

  // Process platform data
  const processedData = useMemo(() => {
    // Platform info
    const platformInfo: PlatformInfo = {
      id: platform.id,
      name: platform.name,
      icon: platform.icon,
      description: platform.description,
      cta: platform.cta,
      ctaHref: platform.ctaHref,
    };

    // Process credentials
    const credentials: Credential[] = (platform.providers || []).map((provider: any) => {
      const providerId = provider.name as PROVIDER_ID;
      const isVerified = verifiedProviders.includes(providerId);
      const isExpired = expiredProviders.includes(providerId);
      const isDeduplicated = stampDedupStatus[providerId] === true;

      const points = stampWeights[providerId] || 0;
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
    });

    // Group credentials
    const credentialGroups: CredentialGroup[] = platform.credentialGroups || [
      {
        title: "Available Stamps",
        credentials,
      },
    ];

    // Calculate points
    const verifiedCredentials = credentials.filter((c) => c.verified && !c.flags.includes("deduplicated"));
    const pointsGained = verifiedCredentials.reduce((sum, c) => sum + c.points, 0);
    const totalPossiblePoints = credentials.reduce((sum, c) => sum + c.points, 0);

    // Verification state
    const verificationState: VerificationState = {
      isVerified: verifiedCredentials.length > 0,
      isLoading: false, // TODO: Get from actual loading state
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
    };
  }, [platform, verifiedProviders, expiredProviders, stampWeights, stampDedupStatus]);

  const { platformInfo, verificationState, credentialGroups, steps } = processedData;
  const hasSteps = steps.length > 0;
  const stampGridCols = getStampGridCols(isMobile, isWide, hasSteps);

  // Determine if description/points should stack vertically
  const shouldStack = stampGridCols === 1;

  return (
    <Drawer isOpen={isOpen} onClose={onClose} placement="right" size={isMobile ? "full" : isWide ? "xl" : "md"}>
      <DrawerOverlay />
      <DrawerContent
        style={{
          background: "rgb(var(--color-background))",
          border: "1px solid rgb(var(--color-foreground-5))",
          borderRadius: isMobile ? "0" : "16px 0 0 16px",
        }}
      >
        <DrawerBody padding="0" display="flex" flexDirection="column" height="100vh">
          {isMobile ? (
            // Mobile layout - single column
            <>
              <DrawerHeader icon={platformInfo.icon} name={platformInfo.name} onClose={onClose} />

              <div className="flex-1 overflow-y-auto px-4 py-6">
                <PointsModule
                  variant={verificationState.isVerified ? "post-verification" : "pre-verification"}
                  timeToGet={verificationState.timeToGet}
                  price={verificationState.price}
                  pointsGained={verificationState.pointsGained}
                  totalPossiblePoints={verificationState.totalPossiblePoints}
                  compact={true}
                />

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

              <DrawerFooter onUpdateScore={onUpdateScore} />
            </>
          ) : hasSteps ? (
            // Desktop with steps - two column layout
            <div className="flex-1 overflow-hidden flex">
              {/* Left Column - Stamps */}
              <div className={`${isWide ? "w-2/3" : "w-1/2"} flex flex-col h-full border-r border-gray-200`}>
                <DrawerHeader icon={platformInfo.icon} name={platformInfo.name} onClose={onClose} />

                <div className="flex-1 overflow-y-auto p-8">
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
                    <div className={`${shouldStack ? "" : "flex-shrink-0 w-80"}`}>
                      <PointsModule
                        variant={verificationState.isVerified ? "post-verification" : "pre-verification"}
                        timeToGet={verificationState.timeToGet}
                        price={verificationState.price}
                        pointsGained={verificationState.pointsGained}
                        totalPossiblePoints={verificationState.totalPossiblePoints}
                        validityDays={verificationState.validityDays}
                      />
                    </div>
                  </div>

                  {/* Stamps */}
                  <CredentialGrid credentialGroups={credentialGroups} columns={stampGridCols} />
                </div>

                <DrawerFooter onUpdateScore={onUpdateScore} />
              </div>

              {/* Right Column - Steps */}
              <div className={`${isWide ? "w-1/3" : "w-1/2"} p-8 overflow-y-auto`}>
                <StepGuide steps={steps} />
              </div>
            </div>
          ) : (
            // Desktop without steps - single column
            <>
              <DrawerHeader icon={platformInfo.icon} name={platformInfo.name} onClose={onClose} />

              <div className="flex-1 overflow-y-auto p-8">
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
                  <div className={`${shouldStack ? "" : "flex-shrink-0 w-80"}`}>
                    <PointsModule
                      variant={verificationState.isVerified ? "post-verification" : "pre-verification"}
                      timeToGet={verificationState.timeToGet}
                      price={verificationState.price}
                      pointsGained={verificationState.pointsGained}
                      totalPossiblePoints={verificationState.totalPossiblePoints}
                      validityDays={verificationState.validityDays}
                    />
                  </div>
                </div>

                {/* Stamps */}
                <CredentialGrid credentialGroups={credentialGroups} columns={stampGridCols} />
              </div>

              <DrawerFooter onUpdateScore={onUpdateScore} />
            </>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

export { StampDrawer };
