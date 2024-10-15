import { useContext, useEffect, useMemo, useState } from "react";
import { useMessage } from "../../hooks/useMessage";
import { CeramicContext } from "../../context/ceramicContext";
import { useAttestation } from "../../hooks/useAttestation";
import { PROVIDER_ID, Passport, Stamp } from "@gitcoin/passport-types";
import {
  badgeContractInfo,
  scrollCampaignBadgeProviderInfo,
  scrollCampaignBadgeProviders,
  scrollCampaignChain,
} from "../../config/scroll_campaign";
import { ProviderWithTitle } from "../ScrollCampaign";
import { ScrollCampaignPage } from "./ScrollCampaignPage";
import { LoadingBarSection, LoadingBarSectionProps } from "../LoadingBar";
import { LoadButton } from "../LoadButton";

export const getEarnedBadges = (badgeStamps: Stamp[]): ProviderWithTitle[] => {
  if (badgeStamps.length === 0) {
    return [];
  }
  return badgeContractInfo.map((contract) => {
    const relevantStamps = badgeStamps.filter((stamp) =>
      contract.providers.some(({ name }) => name === stamp.provider)
    );

    if (relevantStamps.length === 0) {
      return {
        title: contract.title,
        name: "No Provider" as PROVIDER_ID,
        image: "",
        level: 0,
      };
    }

    const highestLevelProvider = relevantStamps.reduce(
      (highest, stamp) => {
        const provider = contract.providers.find(({ name }) => name === stamp.provider);
        if (provider && provider.level > highest.level) {
          return provider;
        }
        return highest;
      },
      { level: -1, name: "No Provider" as PROVIDER_ID, image: "" }
    );

    return {
      title: contract.title,
      ...highestLevelProvider,
    };
  });
};

export const ScrollMintBadge = ({
  onMintBadge,
}: {
  onMintBadge: (earnedBadges: ProviderWithTitle[]) => Promise<void>;
}) => {
  const { failure } = useMessage();
  const { database } = useContext(CeramicContext);
  const { needToSwitchChain } = useAttestation({ chain: scrollCampaignChain });

  const [passport, setPassport] = useState<Passport | undefined>(undefined);

  useEffect(() => {
    (async () => {
      if (database) {
        const passportLoadResponse = await database.getPassport();
        if (passportLoadResponse.status === "Success") {
          setPassport(passportLoadResponse.passport);
        } else {
          failure({
            title: "Error",
            message: "An unexpected error occurred while loading your Passport.",
          });
        }
      }
    })();
  }, [database, failure]);

  const badgeStamps = useMemo(
    () => (passport ? passport.stamps.filter(({ provider }) => scrollCampaignBadgeProviders.includes(provider)) : []),
    [passport]
  );

  const loading = !passport;

  const deduplicatedBadgeStamps = useMemo(
    // TODO Deduplicate by seeing if in burnedHashes but not user's hashes
    () => badgeStamps.filter(({ provider }) => true),
    [badgeStamps]
  );

  const hasDeduplicatedCredentials = badgeStamps.length > deduplicatedBadgeStamps.length;

  const highestLevelBadgeStamps = useMemo(
    () =>
      Object.values(
        deduplicatedBadgeStamps.reduce(
          (acc, credential) => {
            const { contractAddress, level } = scrollCampaignBadgeProviderInfo[credential.provider];
            if (!acc[contractAddress] || level > acc[contractAddress].level) {
              acc[contractAddress] = { level, credential };
            }
            return acc;
          },
          {} as Record<string, { level: number; credential: Stamp }>
        )
      ).map(({ credential }) => credential),
    [deduplicatedBadgeStamps]
  );

  const earnedBadges = getEarnedBadges(badgeStamps);

  const hasBadge = deduplicatedBadgeStamps.length > 0;
  const hasMultipleBadges = deduplicatedBadgeStamps.length > 1;

  const ScrollLoadingBarSection = (props: LoadingBarSectionProps) => (
    <LoadingBarSection loadingBarClassName="h-10 via-[#FFEEDA] brightness-50" {...props} />
  );

  return (
    <ScrollCampaignPage fadeBackgroundImage={loading || hasBadge} earnedBadges={earnedBadges}>
      <ScrollLoadingBarSection
        isLoading={loading}
        className={`text-5xl ${hasBadge ? "text-[#FFEEDA]" : "text-[#FF684B]"}`}
      >
        {hasBadge ? "Congratulations!" : "We're sorry!"}
      </ScrollLoadingBarSection>
      <ScrollLoadingBarSection isLoading={loading} className="text-xl mt-2">
        {hasBadge ? (
          <div>
            You qualify for {highestLevelBadgeStamps.length} badge{hasMultipleBadges ? "s" : ""}. Mint your badge
            {hasMultipleBadges ? "s" : ""} and get a chance to work with us.
            {hasDeduplicatedCredentials
              ? " (Some badge credentials could not be validated because they have already been claimed on another address.)"
              : ""}
          </div>
        ) : hasDeduplicatedCredentials ? (
          "Your badge credentials have already been claimed with another address."
        ) : (
          "You don't qualify for any badges."
        )}
      </ScrollLoadingBarSection>

      {hasBadge && (
        <div className="mt-8">
          <LoadButton
            variant="custom"
            onClick={() => onMintBadge(earnedBadges)}
            isLoading={loading}
            className="text-color-1 text-lg font-bold bg-[#FF684B] hover:brightness-150 py-3 transition-all duration-200"
          >
            <div className="flex flex-col items-center justify-center">{"Mint Badge"}</div>
          </LoadButton>
          {needToSwitchChain && (
            <div className="text-[#FF684B] mt-4">
              You will be prompted to switch to the Scroll chain, and then to submit a transaction.
            </div>
          )}
        </div>
      )}
    </ScrollCampaignPage>
  );
};
