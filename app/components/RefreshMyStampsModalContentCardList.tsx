// --- Utils
import { PossibleEVMProvider } from "../signer/utils";

// --- Types
import { getPlatformSpec } from "../config/platforms";
import { PROVIDER_ID } from "@gitcoin/passport-platforms/src/types";
import { evmPlatformProvider } from "./RefreshMyStampsModalContent";

// --- App components
import { RefreshMyStampsModalContentCard } from "./RefreshMyStampsModalContentCard";

export type RefreshMyStampsModalCardListProps = {
  fetchedPossibleEVMStamps: PossibleEVMProvider[] | undefined;
  verifiedProviders: PROVIDER_ID[];
  selectedProviders: PROVIDER_ID[];
  setSelectedProviders: (providerIds: PROVIDER_ID[]) => void;
};

export const RefreshMyStampsModalContentCardList = ({
  fetchedPossibleEVMStamps,
  verifiedProviders,
  selectedProviders,
  setSelectedProviders,
}: RefreshMyStampsModalCardListProps) => {
  const cardList = fetchedPossibleEVMStamps?.map((possiblePlatform: PossibleEVMProvider, index: number) => {
    const currentPlatform = getPlatformSpec(possiblePlatform.platformProps.platform.path);
    const platformGroup = possiblePlatform.platformProps.platFormGroupSpec;

    return (
      <RefreshMyStampsModalContentCard
        key={currentPlatform ? currentPlatform.name : `undefined-${index}`}
        platformGroup={platformGroup}
        currentPlatform={currentPlatform}
        verifiedProviders={verifiedProviders}
        selectedProviders={selectedProviders}
        setSelectedProviders={setSelectedProviders}
      />
    );
  });

  return <>{cardList}</>;
};
