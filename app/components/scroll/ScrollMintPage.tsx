import { useContext, useEffect, useMemo, useState } from "react";
import { useMessage } from "../../hooks/useMessage";
import { CeramicContext } from "../../context/ceramicContext";
import { Passport, Stamp, VerifiableCredential } from "@gitcoin/passport-types";
import {
  scrollCampaignBadgeProviderInfo,
  scrollCampaignBadgeProviders,
  scrollCampaignChain,
} from "../../config/scroll_campaign";
import PassportScoreScrollBadgeAbi from "../../abi/PassportScoreScrollBadge.json";
import { ScrollMintingBadge } from "./ScrollMintingBadge";
import { ScrollInitiateMintBadge } from "./ScrollInitiateMintBadge";
import { useAccount, usePublicClient } from "wagmi";

export const ScrollMintBadge = ({
  onMint,
  syncingToChain,
}: {
  onMint: (args: { credentials: VerifiableCredential[] }) => Promise<void>;
  syncingToChain: boolean;
}) => {
  const publicClient = usePublicClient({
    chainId: parseInt(scrollCampaignChain?.id || ""),
  });
  const [passport, setPassport] = useState<Passport | undefined>(undefined);
  const { database } = useContext(CeramicContext);
  const { failure } = useMessage();
  const [deduplicatedBadgeStamps, setDeduplicatedBadgeStamps] = useState<Stamp[]>([]);
  const [checkingOnchainBadges, setCheckingOnchainBadges] = useState(true);
  const { address } = useAccount();

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
    if (!scrollCampaignChain || !publicClient) return;
    (async () => {
      try {
        setCheckingOnchainBadges(true);

        const validBadgeStamps: Stamp[] = [];

        const cachedUserHashes: Record<string, string[]> = {};

        await Promise.all(
          badgeStamps.map(async (stamp) => {
            const stampHash =
              "0x" +
              Buffer.from((stamp.credential.credentialSubject.hash || "").split(":")[1], "base64").toString("hex");

            const { contractAddress } = scrollCampaignBadgeProviderInfo[stamp.provider];

            const badgeContract = {
              address: contractAddress as `0x${string}`,
              abi: PassportScoreScrollBadgeAbi.abi,
            };

            const isBurned = Boolean(
              await publicClient.readContract({
                ...badgeContract,
                functionName: "burntProviderHashes",
                args: [stampHash],
              })
            );

            if (isBurned) {
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
                    userHash =
                      ((await publicClient.readContract({
                        ...badgeContract,
                        functionName: "userProviderHashes",
                        args: [address, index],
                      })) as string) || "0x0";
                  } catch {
                    userHash = "0x0";
                  }
                  cachedUserHashes[contractAddress][index] = userHash;
                }

                if (userHash === stampHash) {
                  // If it's burned by this user, it's valid
                  validBadgeStamps.push(stamp);
                }

                index++;
              } while (userHash !== "0x0");
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
  }, [badgeStamps, address, failure, publicClient]);

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
  const hasDeduplicatedCredentials = !checkingOnchainBadges && badgeStamps.length > deduplicatedBadgeStamps.length;

  const earnedBadges = useMemo(
    () =>
      highestLevelBadgeStamps.map(({ provider }) => ({
        ...scrollCampaignBadgeProviderInfo[provider],
        name: provider,
      })),
    [highestLevelBadgeStamps]
  );

  return syncingToChain ? (
    <ScrollMintingBadge earnedBadges={earnedBadges} />
  ) : (
    <ScrollInitiateMintBadge
      onMint={onMint}
      credentialsLoading={loading}
      hasDeduplicatedCredentials={hasDeduplicatedCredentials}
      deduplicatedBadgeStamps={deduplicatedBadgeStamps}
      highestLevelBadgeStamps={highestLevelBadgeStamps}
      earnedBadges={earnedBadges}
    />
  );
};
