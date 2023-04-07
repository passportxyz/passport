import { useRouter } from "next/router";
import { Switch } from "@chakra-ui/react";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformSpec } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { useState } from "react";
import { PlatformGroupSpec } from "../config/providers";
import { getStampProviderFilters } from "../config/filters";

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
  // stamp filter
  const router = useRouter();
  const { filter } = router.query;
  const stampFilters = filter?.length && typeof filter === "string" ? getStampProviderFilters(filter) : false;

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
            <p className="ml-4 text-sm font-bold text-color-3">{stamp.platformGroup}</p>
            <div className="flex flex-row justify-between">
              <ul className="marker:leading-1 list-disc marker:text-3xl ">
                {stamp.providers?.map((provider, i) => {
                  return (
                    <li
                      className={`ml-4 ${
                        verifiedProviders?.indexOf(provider.name as PROVIDER_ID) !== -1 ? "text-accent" : "text-muted"
                      }`}
                      key={`${provider.title}${i}`}
                      data-testid={`indicator-${provider.name}`}
                    >
                      <div className="relative top-[-0.3em] text-sm">{provider.title}</div>
                    </li>
                  );
                })}
              </ul>
              <div className="align-right flex">
                <Switch
                  colorScheme="accent"
                  size="lg"
                  data-testid={`switch-${i}`}
                  isChecked={
                    stamp.providers?.reduce(
                      (isPresent, provider) =>
                        isPresent || selectedProviders?.indexOf(provider.name as PROVIDER_ID) !== -1,
                      false as boolean // typing the response - always bool
                    ) || false
                  }
                  onChange={(e) => {
                    // grab all provider_ids for this group of stamps
                    const providerIds = stamp.providers?.map((provider) => provider.name as PROVIDER_ID);

                    // set the selected items by concating or filtering by providerId
                    setSelectedProviders &&
                      setSelectedProviders(
                        e.target.checked
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
