// --- Types
import { getPlatformSpec } from "../config/platforms";
import { PROVIDER_ID } from "@gitcoin/passport-types";

// --- App components
import { RefreshMyStampsModalContentCard } from "./RefreshMyStampsModalContentCard";
import { ValidatedPlatform } from "../signer/utils";

export type RefreshMyStampsModalCardListProps = {
  validPlatforms: ValidatedPlatform[];
  selectedProviders: PROVIDER_ID[];
  setSelectedProviders: (providerIds: PROVIDER_ID[]) => void;
};

export const RefreshMyStampsModalContentCardList = ({
  validPlatforms,
  selectedProviders,
  setSelectedProviders,
}: RefreshMyStampsModalCardListProps) => {
  const cardList = validPlatforms.map((validPlatform: ValidatedPlatform, index: number) => {
    const currentPlatform = getPlatformSpec(validPlatform.platformProps.platform.path);
    const platformGroups = validPlatform.groups;

    return (
      <RefreshMyStampsModalContentCard
        key={currentPlatform ? currentPlatform.name : `undefined-${index}`}
        platformGroups={platformGroups}
        currentPlatform={currentPlatform}
        selectedProviders={selectedProviders}
        setSelectedProviders={setSelectedProviders}
      />
    );
  });

  return <>{cardList}</>;
};
