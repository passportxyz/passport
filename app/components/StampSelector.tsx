import React, { useContext, useMemo } from "react";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformSpec } from "@gitcoin/passport-platforms";
import { PlatformGroupSpec } from "../config/providers";
import { OnChainContext } from "../context/onChainContext";
import { OnchainTag } from "./OnchainTag";
import { CeramicContext } from "../context/ceramicContext";
import { FeatureFlags } from "../config/feature_flags";
import Checkbox from "../components/Checkbox";
import { ScorerContext } from "../context/scorerContext";
import { useCustomization } from "../hooks/useCustomization";
import { isDynamicCustomization } from "../utils/customizationUtils";

type StampSelectorProps = {
  currentPlatform?: PlatformSpec | undefined;
  currentProviders: PlatformGroupSpec[] | undefined;
  verifiedProviders: PROVIDER_ID[] | undefined;
  selectedProviders: PROVIDER_ID[] | undefined;
  setSelectedProviders: (providerIds: PROVIDER_ID[]) => void;
};

export function StampSelector({
  currentPlatform,
  currentProviders,
  verifiedProviders,
  selectedProviders,
  setSelectedProviders,
}: StampSelectorProps) {
  const { allProvidersState } = useContext(CeramicContext);
  const { activeChainProviders } = useContext(OnChainContext);
  const { stampWeights } = useContext(ScorerContext);
  const includedGroupsAndProviders = useIncludedGroupsAndProviders(currentProviders || []);

  // check if provider is on-chain
  const isProviderOnChain = (provider: PROVIDER_ID) => {
    if (currentPlatform) {
      const providerObj = activeChainProviders.find((p) => p.providerName === provider);
      if (providerObj) {
        return providerObj.credentialHash === allProvidersState[provider]?.stamp?.credential.credentialSubject.hash;
      }
    }

    return false;
  };

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
            <p className="mb-1 text-xl">{stamp.platformGroup}</p>
            {stamp.providers?.map((provider, i) => {
              if (!includedGroupsAndProviders[stamp.platformGroup].includes(provider.name)) {
                return null;
              }
              const verified = verifiedProviders?.indexOf(provider.name) !== -1;
              const selected = selectedProviders?.indexOf(provider.name) !== -1;

              let textColor = verified ? "text-color-2" : "text-color-1";

              const onChange = (checked: boolean) =>
                setSelectedProviders(
                  checked
                    ? (selectedProviders || []).concat(provider.name)
                    : (selectedProviders || []).filter((id) => id !== provider.name)
                );

              const rawWeight = stampWeights?.[provider.name];
              const weight = rawWeight ? +parseFloat(rawWeight).toFixed(2) : 0;

              const checkboxId = `${provider.name}StampCheckbox`;

              return (
                <React.Fragment key={provider.name}>
                  <div
                    data-testid={`indicator-${provider.name}`}
                    className={`relative border-foreground-3 ${provider.description ? "pt-3" : "py-3"} text-base ${
                      i > 0 ? "border-t" : "border-none"
                    } ${textColor} flex items-center`}
                  >
                    <Checkbox
                      data-testid={`checkbox-${provider.name}`}
                      className="mr-2 shrink-0"
                      id={checkboxId}
                      checked={selected}
                      onChange={onChange}
                    />
                    <label htmlFor={checkboxId}>{provider.title}</label>
                    {FeatureFlags.FF_CHAIN_SYNC && isProviderOnChain(provider.name) && <OnchainTag marginLeft="3" />}
                    <span className="ml-2 grow text-right">{weight}&nbsp;points</span>
                  </div>
                  {provider.description && (
                    <>
                      <p className="my-2 text-sm italic">{provider.description}</p>
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

const useIncludedGroupsAndProviders = (specs: PlatformGroupSpec[]): Record<string, string[]> => {
  const customization = useCustomization();

  const included = useMemo(() => {
    const included: Record<string, string[]> = {};
    specs.forEach((spec) => {
      const providers = spec.providers?.map((p) => p.name) || [];

      if (!isDynamicCustomization(customization) || !customization.scorer?.weights) {
        included[spec.platformGroup] = providers;
        return;
      }

      included[spec.platformGroup] = providers.reduce((includedProviders, provider) => {
        if (parseFloat(customization.scorer?.weights?.[provider] || "0") > 0) {
          includedProviders.push(provider);
        }
        return includedProviders;
      }, [] as string[]);
    });

    return included;
  }, [specs, customization]);

  return included;
};
