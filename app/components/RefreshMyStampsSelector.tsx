import { Checkbox } from "@chakra-ui/react";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformSpec } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { PlatformGroupSpec } from "../config/providers";

type RefreshMyStampsSelectorProps = {
  currentPlatform?: PlatformSpec | undefined;
  currentProviders: PlatformGroupSpec[] | undefined;
  verifiedProviders: PROVIDER_ID[] | undefined;
  selectedProviders: PROVIDER_ID[] | undefined;
  setSelectedProviders: (providerIds: PROVIDER_ID[]) => void;
  switchState: { checked: boolean };
};

export function RefreshMyStampsSelector({
  currentPlatform,
  currentProviders,
  verifiedProviders,
  selectedProviders,
  setSelectedProviders,
  switchState,
}: RefreshMyStampsSelectorProps) {
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
                          data-testid={`checked-${i}`}
                          value={provider.name}
                          disabled={!switchState.checked}
                          defaultChecked={switchState.checked}
                          size="lg"
                          onChange={(e) => {
                            // set the selected items by concating or filtering by providerId
                            const value = e.target.value as PROVIDER_ID;
                            setSelectedProviders &&
                              setSelectedProviders(
                                e.target.checked
                                  ? (selectedProviders || []).concat(provider.name)
                                  : (selectedProviders || []).filter((providerId) => providerId !== value)
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
