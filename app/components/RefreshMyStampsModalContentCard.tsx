// --- React hooks
import { useMemo, useState, useRef } from "react";

// --- Types
import { ValidatedProviderGroup } from "../signer/utils";

// --- UI components
import { Switch, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from "@chakra-ui/react";

// --- Utils
import { PlatformSpec, PROVIDER_ID } from "@gitcoin/passport-platforms/src/types";

// --- App components
import { RefreshMyStampsSelector } from "../components/RefreshMyStampsSelector";

type RefreshMyStampsModalCardProps = {
  platformGroups: ValidatedProviderGroup[];
  selectedProviders: PROVIDER_ID[];
  currentPlatform: PlatformSpec | undefined;
  setSelectedProviders: (providerIds: PROVIDER_ID[]) => void;
};

export const RefreshMyStampsModalContentCard = ({
  platformGroups,
  currentPlatform,
  selectedProviders,
  setSelectedProviders,
}: RefreshMyStampsModalCardProps): JSX.Element => {
  const [disableExpand, setDisableExpand] = useState(false);
  const [accordionExpanded, setAccordionExpanded] = useState(false);

  const accordionButton = useRef<HTMLButtonElement>(null);
  const platformProviders = useMemo(
    () => platformGroups.map(({ providers }) => providers?.map(({ name }) => name)).flat(2),
    [platformGroups]
  );

  const checked = useMemo(
    () => (selectedProviders || []).some((provider) => platformProviders?.indexOf(provider) !== -1),
    [selectedProviders, platformProviders]
  );

  return (
    <div>
      <Accordion allowToggle>
        <AccordionItem className="py-2 first:border-t-accent-2 first:border-b-accent-2" isDisabled={disableExpand}>
          <div className="grid grid-cols-10 items-center justify-between text-white focus:shadow-none">
            <div className="col-span-8 items-center justify-start">
              <AccordionButton
                _focus={{ outline: "none" }}
                ref={accordionButton}
                onClick={() => setAccordionExpanded(!accordionExpanded)}
              >
                <img src={currentPlatform?.icon} alt={currentPlatform?.name} className="mr-5 h-11 w-11" />
                <p className="text-left">{currentPlatform?.name}</p>
              </AccordionButton>
            </div>
            <div className="grid grid-cols-2 items-center justify-end gap-8">
              <Switch
                data-testid={`switch-${currentPlatform?.name}`}
                value={`${currentPlatform?.name}`}
                colorScheme="purple"
                isChecked={checked}
                onChange={(e) => {
                  if (!e.target.checked && accordionExpanded) {
                    // collapse before disabling accordion
                    accordionButton.current?.click();
                    setAccordionExpanded(false);
                  }
                  setDisableExpand(!disableExpand);
                  if (e.target.checked) {
                    setSelectedProviders((selectedProviders || []).concat(platformProviders));
                  } else {
                    setSelectedProviders(
                      (selectedProviders || []).filter((provider) => platformProviders?.indexOf(provider) === -1)
                    );
                  }
                }}
              />
              <AccordionIcon
                className="cursor-pointer"
                marginLeft="8px"
                fontSize="28px"
                onClick={() => {
                  accordionButton.current?.click();
                }}
              />
            </div>
          </div>
          <AccordionPanel borderTop="1px solid #083A40" marginTop="8px" paddingLeft="0" paddingRight="0">
            <RefreshMyStampsSelector
              validPlatformGroups={platformGroups}
              selectedProviders={selectedProviders}
              setSelectedProviders={setSelectedProviders}
              platformChecked={checked}
            />
          </AccordionPanel>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
