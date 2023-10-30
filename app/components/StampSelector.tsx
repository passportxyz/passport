import { useContext, useEffect } from "react";
import { useRouter } from "next/router";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformSpec } from "@gitcoin/passport-platforms";
import { PlatformGroupSpec } from "../config/providers";
import { getStampProviderFilters } from "../config/filters";
import { OnChainContext } from "../context/onChainContext";
import { OnchainTag } from "./OnchainTag";
import { CeramicContext } from "../context/ceramicContext";
import { FeatureFlags } from "../config/feature_flags";
import Checkbox from "../components/Checkbox";
import { ScorerContext } from "../context/scorerContext";

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
  // stamp filter
  const router = useRouter();
  const { filter } = router.query;
  const stampFilters = filter?.length && typeof filter === "string" ? getStampProviderFilters(filter) : false;

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
      {currentProviders?.map((stamp, i) => {
        // hide stamps based on filter
        const hideStamp =
          stampFilters && currentPlatform && !stampFilters[currentPlatform?.platform]?.includes(stamp.platformGroup);
        if (hideStamp) return null;
        else if (stampFilters) {
          // only show first stamp when filtered
          stamp.providers = [stamp.providers[0]];
        }

        return (
          <div key={i} className={`mt-6`}>
            <p className="mb-1 text-xl">{stamp.platformGroup}</p>
            {stamp.providers?.map((provider, i) => {
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
                <div
                  key={provider.name}
                  data-testid={`indicator-${provider.name}`}
                  className={`relative border-foreground-3 py-3 text-base ${
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
              );
            })}
          </div>
        );
      })}
    </>
  );
}
