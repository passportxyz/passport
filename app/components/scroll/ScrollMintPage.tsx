import { useContext, useEffect, useMemo, useState } from "react";
import { useMessage } from "../../hooks/useMessage";
import { CeramicContext } from "../../context/ceramicContext";
import { useAttestation } from "../../hooks/useAttestation";
import { Passport, Stamp } from "@gitcoin/passport-types";
import {
  scrollCampaignBadgeProviderInfo,
  scrollCampaignBadgeProviders,
  scrollCampaignChain,
} from "../../config/scroll_campaign";
import { ProviderWithTitle } from "../ScrollCampaign";
import { ScrollCampaignPage } from "./ScrollCampaignPage";
import { LoadingBarSection, LoadingBarSectionProps } from "../LoadingBar";
import { LoadButton } from "../LoadButton";
import { useWalletStore } from "../../context/walletStore";
import { ethers } from "ethers";
import PassportScoreScrollBadgeAbi from "../../abi/PassportScoreScrollBadge.json";
import { ScrollMintingBadge } from "./ScrollMintingBadge";
import { useMintBadge } from "../../hooks/useMintBadge";

export const ScrollMintBadge = ({ onMinted }: { onMinted: () => void }) => {
  const [minting, setMinting] = useState(false);
  const [passport, setPassport] = useState<Passport | undefined>(undefined);
  const { database } = useContext(CeramicContext);
  const { failure } = useMessage();
  const [deduplicatedBadgeStamps, setDeduplicatedBadgeStamps] = useState<Stamp[]>([]);
  const [checkingOnchainBadges, setCheckingOnchainBadges] = useState(true);
  const address = useWalletStore((state) => state.address);

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

  useEffect(() => {
    (async () => {
      try {
        setCheckingOnchainBadges(true);

        if (!scrollCampaignChain) return badgeStamps;

        const validBadgeStamps: Stamp[] = [];

        const cachedUserHashes: Record<string, string[]> = {};
        const scrollRpcProvider = new ethers.JsonRpcProvider(scrollCampaignChain.rpcUrl);

        await Promise.all(
          badgeStamps.map(async (stamp) => {
            const stampHash =
              "0x" +
              Buffer.from((stamp.credential.credentialSubject.hash || "").split(":")[1], "base64").toString("hex");

            const { contractAddress } = scrollCampaignBadgeProviderInfo[stamp.provider];
            const badgeContract = new ethers.Contract(
              contractAddress,
              PassportScoreScrollBadgeAbi.abi,
              scrollRpcProvider
            );

            if (await badgeContract.burntProviderHashes(stampHash)) {
              // If burned, check if it's burned by this user
              let index = 0;
              let userHash;
              do {
                if (!cachedUserHashes[contractAddress]) cachedUserHashes[contractAddress] = [];

                if (cachedUserHashes[contractAddress][index] !== undefined) {
                  // Already pulled from the contract
                  userHash = cachedUserHashes[contractAddress][index];
                } else {
                  try {
                    userHash = await badgeContract.userProviderHashes(address, index);
                  } catch {
                    userHash = 0;
                  }
                  cachedUserHashes[contractAddress][index] = userHash;
                }

                if (userHash === stampHash) {
                  // If it's burned by this user, it's valid
                  validBadgeStamps.push(stamp);
                }

                index++;
              } while (userHash !== 0);
            } else {
              // If never burned, it's valid
              validBadgeStamps.push(stamp);
            }
          })
        );

        setDeduplicatedBadgeStamps(validBadgeStamps);
      } catch (error) {
        console.error("Error checking onchain badges", error);
        failure({
          title: "Error",
          message: "An unexpected error occurred while checking for existing onchain badges.",
        });
      } finally {
        setCheckingOnchainBadges(false);
      }
    })();
  }, [badgeStamps, address, failure]);

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

  const loading = !passport || checkingOnchainBadges;
  const hasDeduplicatedCredentials = badgeStamps.length > deduplicatedBadgeStamps.length;

  const earnedBadges = useMemo(
    () =>
      highestLevelBadgeStamps.map(({ provider }) => ({
        ...scrollCampaignBadgeProviderInfo[provider],
        name: provider,
      })),
    [highestLevelBadgeStamps]
  );

  return minting ? (
    <ScrollMintingBadge earnedBadges={earnedBadges} />
  ) : (
    <ScrollInitiateMintBadge
      onMinted={onMinted}
      setMinting={setMinting}
      loading={loading}
      hasDeduplicatedCredentials={hasDeduplicatedCredentials}
      deduplicatedBadgeStamps={deduplicatedBadgeStamps}
      highestLevelBadgeStamps={highestLevelBadgeStamps}
      earnedBadges={earnedBadges}
    />
  );
};

export const ScrollInitiateMintBadge = ({
  onMinted,
  setMinting,
  loading,
  hasDeduplicatedCredentials,
  deduplicatedBadgeStamps,
  highestLevelBadgeStamps,
  earnedBadges,
}: {
  onMinted: () => void;
  setMinting: (minting: boolean) => void;
  loading: boolean;
  hasDeduplicatedCredentials: boolean;
  highestLevelBadgeStamps: Stamp[];
  deduplicatedBadgeStamps: Stamp[];
  earnedBadges: ProviderWithTitle[];
}) => {
  const { needToSwitchChain } = useAttestation({ chain: scrollCampaignChain });
  const { onMint, syncingToChain } = useMintBadge();

  useEffect(() => {
    setMinting(syncingToChain);
  }, [syncingToChain, setMinting]);

  const hasBadge = highestLevelBadgeStamps.length > 0;
  const hasMultipleBadges = highestLevelBadgeStamps.length > 1;

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
            onClick={() =>
              onMint({
                credentials: deduplicatedBadgeStamps.map(({ credential }) => credential),
                onMinted,
              })
            }
            isLoading={loading}
            className="text-color-1 text-lg font-bold bg-[#FF684B] hover:brightness-150 py-3 transition-all duration-200"
          >
            <div className="flex flex-col items-center justify-center">Mint Badge</div>
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
