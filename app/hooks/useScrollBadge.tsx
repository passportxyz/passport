import { ethers, JsonRpcProvider } from "ethers";
import { useState, useEffect, useCallback } from "react";
import PassportScoreScrollBadgeAbi from "../abi/PassportScoreScrollBadge.json";
import { datadogLogs } from "@datadog/browser-logs";
import { scrollCampaignBadgeContractAddresses, scrollCampaignChain } from "../config/scroll_campaign";

export type BadgeInfo = {
  contract: string;
  hasBadge: boolean;
  badgeLevel: number;
};

export const useScrollBadge = (address: string | undefined) => {
  const [areBadgesLoading, setBadgesLoading] = useState<boolean>(true);
  const [badges, setBadges] = useState<BadgeInfo[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string } | {}>({});

  useEffect(() => {
    if (!address) {
      datadogLogs.logger.error(
        `[Scroll-Campaign] Invalid address: ${scrollCampaignBadgeContractAddresses}. Address: ${address}.`
      );
      setErrors((prevErrors) => ({
        ...prevErrors,
        user_address: "Invalid address",
      }));
      setBadgesLoading(false);
      return;
    }

    if (scrollCampaignBadgeContractAddresses.length < 1) {
      datadogLogs.logger.error(
        `[Scroll-Campaign] Invalid contractAddresses: ${scrollCampaignBadgeContractAddresses}. Address: ${address}.`
      );
      setErrors((prevErrors) => ({
        ...prevErrors,
        user_address: "Invalid address",
      }));
      setBadgesLoading(false);
      return;
    }
  }, []);

  const checkBadge = useCallback(async (address: string | undefined) => {
    try {
      if (!scrollCampaignChain) {
        console.log("Scroll Campaign Chain not found");
        return;
      }
      setBadgesLoading(true);
      const scrollRpcProvider = new JsonRpcProvider(scrollCampaignChain.rpcUrl);

      const badges = await Promise.all(
        scrollCampaignBadgeContractAddresses.map(async (contractAddress) => {
          let resultHasBadge: boolean = false;
          let resultBadgeLevel: number = 0;

          try {
            console.log(`[Scroll-Campaign] Checking if ${address} has badge level for contract: ${contractAddress}`);
            datadogLogs.logger.info(
              `[Scroll-Campaign] Checking if ${address} has badge level for contract: ${contractAddress}`
            );
            const contract = new ethers.Contract(contractAddress, PassportScoreScrollBadgeAbi.abi, scrollRpcProvider);
            resultHasBadge = await contract.hasBadge(address);
            if (resultHasBadge) {
              // Get badge level and other data
              try {
                datadogLogs.logger.info(`[Scroll-Campaign] Fetching contract data for: ${contractAddress}`);
                resultBadgeLevel = Number(await contract.badgeLevel(address));
              } catch (err) {
                console.error(`[Scroll-Campaign] Error fetching contract data for ${contractAddress} : ${err}`);
                datadogLogs.logger.error(
                  `[Scroll-Campaign] Error fetching contract data for ${contractAddress} : ${err}`
                );
                setErrors((prevErrors) => ({
                  ...prevErrors,
                  [`contract_data_${contractAddress}`]: "Failed to fetch contract data",
                }));
              }
            }
          } catch (err) {
            console.error("Error checking badge for contract", contractAddress, ":", err);
            datadogLogs.logger.error(
              `[Scroll-Campaign] Error checking if ${address} has badge level for contract: ${contractAddress}. Err : ${err}`
            );
            setErrors((prevErrors) => ({
              ...prevErrors,
              [`badge_${contractAddress}`]: "Failed to fetch badge",
            }));
          }
          return {
            contract: contractAddress,
            hasBadge: resultHasBadge,
            badgeLevel: resultBadgeLevel,
          };
        })
      );
      setBadges(badges);
    } catch (err) {
      console.error(`[Scroll-Campaign] Error checking badges : ${err}`);
      datadogLogs.logger.error(`[Scroll-Campaign] Error checking badges : ${err}`);
      setErrors((prevErrors) => ({
        ...prevErrors,
        fetch_badges: "Failed to fetch badges",
      }));
    } finally {
      setBadgesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (address) {
      checkBadge(address);
    }
  }, [address, checkBadge]);

  // Check if user has at least one badge
  const hasAtLeastOneBadge = badges.some((badge) => badge.hasBadge);

  return {
    badges,
    areBadgesLoading,
    errors,
    hasAtLeastOneBadge,
  };
};
