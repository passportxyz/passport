import { Switch } from "@chakra-ui/react";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { useState } from "react";
import { PlatformGroupSpec } from "../config/providers";

type StampSelectorProps = {
  currentProviders: PlatformGroupSpec[] | undefined;
  verifiedProviders: PROVIDER_ID[] | undefined;
  selectedProviders: PROVIDER_ID[] | undefined;
  setSelectedProviders: (providerIds: PROVIDER_ID[]) => void;
};

export function StampSelector({
  currentProviders,
  verifiedProviders,
  selectedProviders,
  setSelectedProviders,
}: StampSelectorProps) {
  return (
    <>
      {/* each of the available providers in this platform */}
      {currentProviders?.map((stamp, i) => {
        return (
          <div key={i} className="border-b py-4 px-6">
            <p className="ml-4 text-sm font-bold">{stamp.platformGroup}</p>
            <div className="flex flex-row justify-between">
              <ul className="marker:leading-1 list-disc marker:text-3xl ">
                {stamp.providers?.map((provider, i) => {
                  return (
                    <li
                      className={`ml-4 ${
                        verifiedProviders?.indexOf(provider.name as PROVIDER_ID) !== -1
                          ? `text-green-500`
                          : `text-gray-400`
                      }`}
                      key={`${provider.title}${i}`}
                      data-testid={`indicator-${provider.name}`}
                    >
                      <div className="relative top-[-0.3em] text-sm text-gray-400">{provider.title}</div>
                    </li>
                  );
                })}
              </ul>
              <div className="align-right flex">
                <Switch
                  colorScheme="green"
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
