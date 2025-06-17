import React, { useContext, useMemo } from "react";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformGroupSpec } from "@gitcoin/passport-platforms";
import { CeramicContext } from "../context/ceramicContext";
import { ScorerContext } from "../context/scorerContext";
import { useCustomization } from "../hooks/useCustomization";

type StampSelectorProps = {
  currentProviders: PlatformGroupSpec[] | undefined;
  verifiedProviders: PROVIDER_ID[] | undefined;
};

const checkMark = () => (
  <svg className="inline-block" width="13" height="9" viewBox="0 0 13 9" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.74412 4.33333L4.32795 8L11.0122 1"
      stroke="#C1F6FF"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ProviderTitle = ({
  title,
  isVerified,
  isExpired,
  isDeduplicated,
  className = "",
}: {
  title: string;
  isVerified: boolean;
  isExpired: boolean;
  isDeduplicated: boolean;
  className?: string;
}) => (
  <div className={`flex items-center flex-wrap gap-2 ${className}`}>
    <span>
      {isVerified && checkMark()} {title}
    </span>
    {isExpired && (
      <span className="text-xs bg-background-5 px-1 rounded text-right font-alt text-black" data-testid="expired-label">
        Expired
      </span>
    )}
    {isDeduplicated && (
      <a
        href="https://support.passport.xyz/passport-knowledge-base/common-questions/why-am-i-receiving-zero-points-for-a-verified-stamp"
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline"
      >
        <span
          className="text-xs bg-foreground-7 px-1 rounded text-right font-alt text-color-4 cursor-pointer hover:bg-foreground-6 transition-colors"
          data-testid="deduped-label"
        >
          Claimed by another wallet
        </span>
      </a>
    )}
  </div>
);

export function StampSelector({ currentProviders, verifiedProviders }: StampSelectorProps) {
  const { expiredProviders } = useContext(CeramicContext);
  const { stampWeights, stampDedupStatus } = useContext(ScorerContext);
  const includedGroupsAndProviders = useIncludedGroupsAndProviders(currentProviders || []);

  return (
    <>
      {/* each of the available providers in this platform */}
      {currentProviders?.map((stamp) => {
        // hide stamps based on filter
        if (includedGroupsAndProviders[stamp.platformGroup].length === 0) {
          return null;
        }

        return (
          <div key={stamp.platformGroup} className={`mt-6`}>
            <p className="mb-1 text-xl font-bold">{stamp.platformGroup}</p>
            {stamp.providers?.map((provider, i) => {
              if (!includedGroupsAndProviders[stamp.platformGroup].includes(provider.name)) {
                return null;
              }
              const isVerified = verifiedProviders?.indexOf(provider.name) !== -1;
              const isExpired = expiredProviders?.indexOf(provider.name) !== -1;
              const isDeduplicated = stampDedupStatus?.[provider.name] || false;

              const rawWeight = stampWeights?.[provider.name];
              const weight = rawWeight ? +parseFloat(rawWeight).toFixed(1) : 0;

              if (isExpired) {
                // Return verified stamp
                return (
                  <React.Fragment key={provider.name}>
                    <div
                      data-testid={`indicator-${provider.name}`}
                      className="relative rounded text-base flex justify-between items-stretch text-color-3 mt-4 border border-background-5 bg-gradient-to-b from-background to-background-5/30"
                    >
                      <div className="p-4 border-r border-background-5 w-3/4">
                        <ProviderTitle
                          title={provider.title}
                          isVerified={isVerified}
                          isExpired={isExpired}
                          isDeduplicated={isDeduplicated}
                        />
                        {provider.description && <p className="my-2 text-sm leading-tight">{provider.description}</p>}
                      </div>

                      <div className="w-1/4 flex items-center text-color-7 py-3">
                        <p className="text-2xl text-center w-full text-s leading-none">
                          <span>{weight}</span> <br />
                          <span className="text-base">points</span>
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              } else if (isVerified) {
                return (
                  <React.Fragment key={provider.name}>
                    <div
                      data-testid={`indicator-${provider.name}`}
                      className={`relative rounded text-base flex justify-between items-stretch border mt-4 text-gray-800`}
                    >
                      <div className={`p-4 border-r w-3/4`}>
                        <ProviderTitle
                          title={provider.title}
                          isVerified={isVerified}
                          isExpired={isExpired}
                          isDeduplicated={isDeduplicated}
                          className="font-bold"
                        />
                        {provider.description && <p className="my-2 text-sm leading-tight">{provider.description}</p>}
                      </div>

                      <div className="w-1/4 flex items-center py-3">
                        <p className="text-2xl text-center w-full text-s leading-none">
                          <span className="font-bold">{isDeduplicated ? "0" : weight}</span> <br />
                          <span className="text-base">points</span>
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              } else {
                // Return unverified stamp
                return (
                  <React.Fragment key={provider.name}>
                    <div
                      data-testid={`indicator-${provider.name}`}
                      className={`relative rounded border-color-3 text-base flex justify-between items-stretch border mt-4 `}
                    >
                      <div className="p-4 border-r w-3/4">
                        <p>{provider.title}</p>
                        {provider.description && <p className="my-2 text-sm leading-tight">{provider.description}</p>}
                      </div>

                      <div className="w-1/4 flex items-center py-3">
                        <p className="text-2xl text-center w-full text-s leading-none">
                          <span>{weight}</span> <br />
                          <span className="text-base">points</span>
                        </p>
                      </div>
                    </div>
                  </React.Fragment>
                );
              }
            })}
          </div>
        );
      })}
    </>
  );
}

const useIncludedGroupsAndProviders = (specs: PlatformGroupSpec[]): Record<string, string[]> => {
  const customization = useCustomization();
  const { stampScores } = useContext(ScorerContext);

  const included = useMemo(() => {
    const included: Record<string, string[]> = {};
    specs.forEach(({ platformGroup, providers }) => {
      included[platformGroup] = providers.reduce((includedProviders, provider) => {
        const hasCustomWeights = customization.scorer?.weights;

        // Hide if customization uses custom weights and this has a custom weight of 0
        const checkHiddenByCustomization = () =>
          hasCustomWeights && parseFloat(customization.scorer?.weights?.[provider.name] || "0") <= 0;

        // Hide if deprecated and score is 0
        const checkHiddenByDeprecation = () =>
          provider.isDeprecated && parseFloat(stampScores[provider.name] || "0") <= 0;

        if (!checkHiddenByCustomization() && !checkHiddenByDeprecation()) {
          includedProviders.push(provider.name);
        }

        return includedProviders;
      }, [] as string[]);
    });

    return included;
  }, [specs, customization]);

  return included;
};
