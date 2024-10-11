import { useContext, useEffect, useMemo, useState } from "react";
import { useMessage } from "../../hooks/useMessage";
import { useWalletStore } from "../../context/walletStore";
import { CeramicContext } from "../../context/ceramicContext";
import { useAttestation } from "../../hooks/useAttestation";
import { EasPayload, Passport, Stamp } from "@gitcoin/passport-types";
import {
  scrollCampaignBadgeProviderInfo,
  scrollCampaignBadgeProviders,
  scrollCampaignChain,
} from "../../config/scroll_campaign";
import { ProviderWithTitle, getEarnedBadges } from "../ScrollCampaign";
import { iamUrl } from "../../config/stamp_config";
import { jsonRequest } from "../../utils/AttestationProvider";
import { ScrollCampaignPage } from "./ScrollCampaignPage";
import { LoadingBarSection, LoadingBarSectionProps } from "../LoadingBar";
import { LoadButton } from "../LoadButton";

export const ScrollMintBadge = ({
  onMintBadge,
  onSetEarnedBadges,
}: {
  onMintBadge: () => Promise<void>;
  onSetEarnedBadges: (earnedBadges: ProviderWithTitle[]) => void;
}) => {
  const { failure } = useMessage();
  const { database } = useContext(CeramicContext);
  const address = useWalletStore((state) => state.address);
  const { getNonce, issueAttestation, needToSwitchChain } = useAttestation({ chain: scrollCampaignChain });
  const [syncingToChain, setSyncingToChain] = useState(false);

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
  }, [database]);

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
    [badgeStamps, deduplicatedBadgeStamps]
  );

  const earnedBadges = getEarnedBadges(badgeStamps);
  onSetEarnedBadges(earnedBadges);

  const hasBadge = deduplicatedBadgeStamps.length > 0;
  const hasMultipleBadges = deduplicatedBadgeStamps.length > 1;

  const onMint = async () => {
    try {
      setSyncingToChain(true);

      const nonce = await getNonce();

      if (nonce === undefined) {
        failure({
          title: "Error",
          message: "An unexpected error occurred while trying to get the nonce.",
        });
      } else {
        const url = `${iamUrl}v0.0.0/scroll/dev`;
        const { data }: { data: EasPayload } = await jsonRequest(url, {
          recipient: address || "",
          credentials: deduplicatedBadgeStamps.map(({ credential }) => credential),
          chainIdHex: scrollCampaignChain?.id,
          nonce,
        });

        if (data.error) {
          console.error("error syncing credentials to chain: ", data.error, "nonce:", nonce);
          failure({
            title: "Error",
            message: "An unexpected error occurred while generating attestations.",
          });
        } else {
          issueAttestation({ data });
        }
      }
    } catch (error) {
      console.error("Error minting badge", error);
      failure({
        title: "Error",
        message: "An unexpected error occurred while trying to bring the data onchain.",
      });
    }
    setSyncingToChain(false);
  };

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
            You qualify for {deduplicatedBadgeStamps.length} badge{hasMultipleBadges ? "s" : ""}. Mint your badge
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
            onClick={onMintBadge}
            isLoading={loading || syncingToChain}
            className="text-color-1 text-lg font-bold bg-[#FF684B] hover:brightness-150 py-3 transition-all duration-200"
          >
            <div className="flex flex-col items-center justify-center">
              {syncingToChain ? "Minting..." : "Mint Badge"}
            </div>
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
