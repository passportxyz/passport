// --- React hooks
import { useState, useEffect, ChangeEvent, useCallback } from "react";
// --- UI Components
import { Checkbox } from "@chakra-ui/react";

// --- Types
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformSpec } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { PlatformGroupSpec } from "../config/providers";
import { evmPlatformProvider } from "./RefreshMyStampsModalContent";

type RefreshMyStampsSelectorProps = {
  currentPlatform?: PlatformSpec | undefined;
  currentProviders: PlatformGroupSpec[] | undefined;
  verifiedProviders: PROVIDER_ID[] | undefined;
  selectedEVMPlatformProviders: evmPlatformProvider[];
  setSelectedEVMPlatformProviders: (evmPlatformProviders: evmPlatformProvider[]) => void;
};

export function RefreshMyStampsSelector({
  currentProviders,
  selectedEVMPlatformProviders,
  setSelectedEVMPlatformProviders
}: RefreshMyStampsSelectorProps) {
  const [checkboxesState, setCheckboxesState] = useState<{ checked: boolean; provider: PROVIDER_ID }[]>();
  const [checkboxProviders, setCheckboxProviders] = useState<PROVIDER_ID[]>([]);
  const slicedProviders = switchState.providers.slice(0, switchState.providers.length);

  useEffect(() => {
    if (switchState.checked) {
      setCheckboxesState(switchState.providers?.map((provider) => ({ checked: true, provider: provider })));
      setCheckboxProviders(slicedProviders);
    } else if (!switchState.checked) {
      setCheckboxesState(checkboxesState?.map((checkState) => ({ checked: false, provider: checkState.provider })));
      setCheckboxProviders([]);
    }
  }, [switchState]);

  // if no items are checked, set switchState to false -- toggle off
  const handleCheckboxChecking = useCallback(
    (event) => {
      checkboxesState?.map((checkbox) => {
        if (checkbox.provider === event.target.value) {
          checkbox.checked = event.target.checked;
        }
      });
    },
    [checkboxesState, checkboxProviders, switchState]
  );

  return (
    <>
      {/* each of the available providers in all fetched platforms */}
      {currentProviders?.map((stamp, i) => {
        return (
          <div key={i}>
            <p className="mt-4 text-sm font-bold text-gray-400">{stamp.platformGroup}</p>
            <div>
              <ul className="marker:leading-1 marker:text-3xl ">
                {stamp.providers?.map((provider, i) => {
                  return (
                    <div key={`${provider.title}${i}`} className="mt-5 flex flex-row items-center justify-between">
                      <li key={`${provider.title}${i}`} data-testid={`indicator-${provider.name}`}>
                        <div className="relative mr-10 text-sm text-white">{provider.title}</div>
                      </li>
                      <div className="align-right flex">
                        <Checkbox
                          type="checkbox"
                          key={`${provider.title}${i}`}
                          colorScheme="purple"
                          data-testid={`checkbox-${provider.name}`}
                          value={provider.name}
                          disabled={!switchState.checked}
                          isChecked={
                            checkboxesState?.filter((checkbox) => checkbox.provider === provider.name)[0].checked
                          }
                          size="lg"
                          onChange={(e) => {
                            const providerIds = stamp.providers?.map((provider) => provider.name as PROVIDER_ID);
                            handleCheckboxChecking(e);
                            // set the selected items by concating or filtering by providerId
                            const value = e.target.value as PROVIDER_ID;
                            setSelectedEVMPlatformProviders(
                              e.target.checked
                                ? (selectedEVMPlatformProviders || []).concat({
                                    checked: true,
                                    platformId: value,
                                    platformGroup: platformGroup,
                                  })
                                : (selectedEVMPlatformProviders || []).filter(
                                    (selectedEVMPlatformProvider) => selectedEVMPlatformProvider["platformId"] !== value
                                  )
                            );
                            setCheckboxProviders &&
                              setCheckboxProviders(
                                !e.target.checked && checkboxProviders
                                  ? (checkboxProviders || []).filter((providerId) => providerId !== value)
                                  : [...checkboxProviders]
                              );
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </ul>
            </div>
          </div>
        );
      })}
    </>
  );
}
