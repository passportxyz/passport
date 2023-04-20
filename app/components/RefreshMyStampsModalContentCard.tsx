// --- React hooks
import { useState, useEffect } from "react";

// --- Types
import { evmPlatformProvider } from "./RefreshMyStampsModalContent";

// --- UI components
import { Switch, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from "@chakra-ui/react";

// --- Utils
import { PlatformGroupSpec, PlatformSpec, PROVIDER_ID, PLATFORM_ID } from "@gitcoin/passport-platforms/src/types";

// --- App components
import { RefreshMyStampsSelector } from "../components/RefreshMyStampsSelector";

type RefreshMyStampsModalCardProps = {
  platformGroup: PlatformGroupSpec[];
  verifiedProviders: PROVIDER_ID[];
  selectedProviders: PROVIDER_ID[];
  currentPlatform: PlatformSpec | undefined;
  selectedEVMPlatformProviders: evmPlatformProvider[];
  setSelectedProviders: (providerIds: PROVIDER_ID[]) => void;
  setSelectedEVMPlatformProviders: (evmPlatformProviders: evmPlatformProvider[]) => void;
};

export const RefreshMyStampsModalContentCard = ({
  platformGroup,
  currentPlatform,
  verifiedProviders,
  selectedProviders,
  selectedEVMPlatformProviders,
  setSelectedProviders,
  setSelectedEVMPlatformProviders,
}: RefreshMyStampsModalCardProps): JSX.Element => {
  const [switchState, setSwitchState] = useState<{ checked: boolean; providers: PROVIDER_ID[] }>({
    checked: false,
    providers: [],
  });

  return (
    <div>
      <Accordion allowToggle>
        <AccordionItem className="py-2 first:border-t-accent-2 first:border-b-accent-2">
          <AccordionButton className="items-center justify-between text-white">
            <div className="flex items-center justify-start">
              <img src={currentPlatform?.icon} alt={currentPlatform?.name} className="mr-5 h-11 w-11" />
              <p className="text-left">{currentPlatform?.name}</p>
            </div>
            <div className="grid grid-cols-2 items-center">
              <Switch
                data-testid={`switch-${currentPlatform?.name}`}
                value={`${currentPlatform?.name}`}
                colorScheme="purple"
                isChecked={switchState.checked}
                onChange={(e) => {
                  const value = e.target.value as PLATFORM_ID;
                  const providers = platformGroup
                    ?.map((group) => group.providers?.map((provider) => provider.name))
                    .flat();
                  e.target.checked
                    ? setSwitchState({ checked: true, providers: providers })
                    : setSwitchState({ checked: false, providers: [] });
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
                }}
              />
              <AccordionIcon marginLeft="8px" fontSize="28px" />
            </div>
          </AccordionButton>
          <AccordionPanel borderTop="1px solid #083A40" marginTop="8px" paddingLeft="0" paddingRight="0">
            <RefreshMyStampsSelector
              currentPlatform={currentPlatform}
              currentProviders={platformGroup}
              verifiedProviders={verifiedProviders}
              selectedProviders={selectedProviders}
              setSelectedProviders={(providerIds) => setSelectedProviders && setSelectedProviders(providerIds)}
              switchState={switchState}
              setSwitchState={setSwitchState}
            />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
