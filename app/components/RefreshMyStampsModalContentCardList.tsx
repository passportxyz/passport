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
  selectedEVMPlatformProviders: evmPlatformProvider[];
  setSelectedProviders: (providerIds: PROVIDER_ID[]) => void;
  setSelectedEVMPlatformProviders: (evmPlatformProviders: evmPlatformProvider[]) => void;
};

export const RefreshMyStampsModalContentCardList = ({
  fetchedPossibleEVMStamps,
  verifiedProviders,
  selectedProviders,
  selectedEVMPlatformProviders,
  setSelectedProviders,
  setSelectedEVMPlatformProviders,
}: RefreshMyStampsModalCardListProps) => {
  const cardList = fetchedPossibleEVMStamps?.map((possiblePlatform: PossibleEVMProvider) => {
    const currentPlatform = getPlatformSpec(possiblePlatform.platformProps.platform.path);
    const platformGroup = possiblePlatform.platformProps.platFormGroupSpec;

    return (
      <RefreshMyStampsModalContentCard
        key={currentPlatform?.name}
        platformGroup={platformGroup}
        currentPlatform={currentPlatform}
        verifiedProviders={verifiedProviders}
        selectedProviders={selectedProviders}
        selectedEVMPlatformProviders={selectedEVMPlatformProviders}
        setSelectedProviders={setSelectedProviders}
        setSelectedEVMPlatformProviders={setSelectedEVMPlatformProviders}
      />
    );
  });

  return <>{cardList}</>;
};
