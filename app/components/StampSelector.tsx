import { useContext } from "react";
import { useRouter } from "next/router";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformSpec } from "@gitcoin/passport-platforms";
import { PlatformGroupSpec } from "../config/providers";
import { getStampProviderFilters } from "../config/filters";
import { OnChainContext } from "../context/onChainContext";
import { OnchainTag } from "./OnchainTag";
import Toggle from "./Toggle";
import { CeramicContext } from "../context/ceramicContext";
import { FeatureFlags } from "../config/feature_flags";

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

        return (
          <div key={i} className={`border-b border-accent-2 py-4 px-6 ${i ? "" : "border-t"}`}>
            <p className="ml-4 mb-1 text-sm text-color-4">{stamp.platformGroup}</p>
            <div className="flex flex-row justify-between">
              <ul className="list-disc marker:text-3xl ">
                {stamp.providers?.map((provider, i) => {
                  let bulletColor = "text-color-4";
                  let textColor = "text-color-4";
                  if (verifiedProviders?.indexOf(provider.name) !== -1) {
                    bulletColor = "text-accent";
                    textColor = "text-color-1";
                  }
                  return (
                    <li
                      className={`ml-4 ${bulletColor}`}
                      key={`${provider.title}${i}`}
                      data-testid={`indicator-${provider.name}`}
                    >
                      <div className={`text-md relative top-[-0.3em] ${textColor} flex items-center`}>
                        {provider.title}
                        {FeatureFlags.FF_CHAIN_SYNC && isProviderOnChain(provider.name) && (
                          <OnchainTag marginLeft="3" />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="align-right ml-2">
                <Toggle
                  data-testid={`switch-${i}`}
                  checked={
                    stamp.providers?.reduce(
                      (isPresent, provider) =>
                        isPresent || selectedProviders?.indexOf(provider.name as PROVIDER_ID) !== -1,
                      false as boolean // typing the response - always bool
                    ) || false
                  }
                  onChange={(checked: boolean) => {
                    // grab all provider_ids for this group of stamps
                    const providerIds = stamp.providers?.map((provider) => provider.name as PROVIDER_ID);

                    // set the selected items by concating or filtering by providerId
                    setSelectedProviders &&
                      setSelectedProviders(
                        checked
                          ? (selectedProviders || []).concat(providerIds)
                          : (selectedProviders || []).filter((id) => !providerIds.includes(id))
                      );
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </>
  );
}
