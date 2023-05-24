// --- UI Components
import Checkbox from "./Checkbox";

// --- Types
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { ValidatedProviderGroup } from "../signer/utils";

type RefreshMyStampsSelectorProps = {
  validPlatformGroups: ValidatedProviderGroup[];
  selectedProviders: PROVIDER_ID[] | undefined;
  setSelectedProviders: (providerIds: PROVIDER_ID[]) => void;
  platformChecked: boolean;
};

export function RefreshMyStampsSelector({
  validPlatformGroups,
  selectedProviders,
  setSelectedProviders,
  platformChecked,
}: RefreshMyStampsSelectorProps) {
  return (
    <>
      {/* each of the available providers in all fetched platforms */}
      {validPlatformGroups.map((group, i) => {
        return (
          <div key={i}>
            <p className="mt-4 text-sm text-color-4">{group.name}</p>
            <div>
              <ul className="marker:leading-1 marker:text-3xl ">
                {group.providers.map((provider, i) => {
                  return (
                    <div key={`${provider.title}${i}`} className="mt-5 flex flex-row items-center justify-between">
                      <li key={`${provider.title}${i}`} data-testid={`indicator-${provider.name}`}>
                        <div className="relative mr-10 text-sm text-color-1">{provider.title}</div>
                      </li>
                      <div className="align-right">
                        <Checkbox
                          key={`${provider.title}${i}`}
                          data-testid={`checkbox-${provider.name}`}
                          disabled={!platformChecked}
                          checked={selectedProviders?.includes(provider.name)}
                          onChange={(checked: boolean) => {
                            // set the selected items by concatenating or filtering by providerId
                            setSelectedProviders(
                              checked
                                ? (selectedProviders || []).concat(provider.name)
                                : (selectedProviders || []).filter((providerId) => providerId !== provider.name)
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
