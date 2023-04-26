import { ValidPlatform } from "../pages/Welcome";

// --- Types
import { getPlatformSpec } from "../config/platforms";
import { PROVIDER_ID } from "@gitcoin/passport-platforms/src/types";

// --- App components
import { RefreshMyStampsModalContentCard } from "./RefreshMyStampsModalContentCard";

export type RefreshMyStampsModalCardListProps = {
  validPlatforms: ValidPlatform[];
  selectedProviders: PROVIDER_ID[];
  setSelectedProviders: (providerIds: PROVIDER_ID[]) => void;
};

export const RefreshMyStampsModalContentCardList = ({
  validPlatforms,
  selectedProviders,
  setSelectedProviders,
}: RefreshMyStampsModalCardListProps) => {
  const cardList = validPlatforms.map((validPlatform: ValidPlatform, index: number) => {
    const currentPlatform = getPlatformSpec(validPlatform.path);
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
