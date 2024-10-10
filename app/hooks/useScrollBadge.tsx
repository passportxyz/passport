import { ethers, JsonRpcProvider } from "ethers";
import { useState, useEffect, useCallback } from "react";
import PassportScoreScrollBadgeAbi from "../abi/PassportScoreScrollBadge.json";
import { datadogLogs } from "@datadog/browser-logs";
import { scrollCampaignBadgeContractAddresses, scrollCampaignChain } from "../config/scroll_campaign";

export const useScrollBadge = (address: string | undefined) => {
  const [areBadgesLoading, setBadgesLoading] = useState<boolean>(true);
  const [badges, setBadges] = useState<
    { contract: string; hasBadge: boolean; badgeLevel: number; badgeUri: string; levelThresholds: BigInt[] }[]
  >([]);
  const [errors, setErrors] = useState<{ [key: string]: string } | {}>({});
  const [badgeLevelImageURIs, setBadgeLevelImageURIs] = useState<string[]>([]);
  const [badgeLevelNames, setBadgeLevelNames] = useState<string[]>([]);
  const [badgeLevelDescriptions, setBadgeLevelDescriptions] = useState<string[]>([]);

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

  const fetchContractData = useCallback(async (contractAddress: string, scrollRpcProvider: JsonRpcProvider) => {
    const contract = new ethers.Contract(contractAddress, PassportScoreScrollBadgeAbi.abi, scrollRpcProvider);

    let levelThresholds: BigInt[] = [];
    let imageURIs: string[] = [""]; // Initial value for "no score"
    let names: string[] = ["No Badge"]; // Initial value for "no score"
    let descriptions: string[] = ["No badge earned yet"]; // Initial value for "no score"

    let index = 0;
    while (true) {
      try {
        const threshold = await contract.levelThresholds(index);
        const imageURI = await contract.badgeLevelImageURIs(index + 1);
        const name = await contract.badgeLevelNames(index + 1);
        const description = await contract.badgeLevelDescriptions(index + 1);

        levelThresholds.push(threshold);
        imageURIs.push(imageURI);
        names.push(name);
        descriptions.push(description);

        index++;
      } catch (error) {
        break;
      }
    }

    return { levelThresholds, imageURIs, names, descriptions };
  }, []);

  const checkBadge = useCallback(
    async (address: string | undefined) => {
      try {
        if (!scrollCampaignChain) {
          console.log("Scroll Campaign Chain not found");
          return;
        }
        setBadgesLoading(true);
        const scrollRpcProvider = new JsonRpcProvider(scrollCampaignChain.rpcUrl);

        const badges = await Promise.all(
          scrollCampaignBadgeContractAddresses.map(async (contractAddress) => {
            let resultHasBadge = false;
            let resultBadgeLevel = 0;
            let resultBadgeUri = "";
            let levelThresholds: BigInt[] = [];
            let badgeLevelImageURIs: string[] = [];
            let badgeLevelNames: string[] = [];
            let badgeLevelDescriptions: string[] = [];

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
                  const contractData = await fetchContractData(contractAddress, scrollRpcProvider);
                  levelThresholds = contractData.levelThresholds;
                  badgeLevelImageURIs = contractData.imageURIs;
                  badgeLevelNames = contractData.names;
                  badgeLevelDescriptions = contractData.descriptions;

                  resultBadgeLevel = await contract.badgeLevel(address);
                  resultBadgeUri = badgeLevelImageURIs[resultBadgeLevel];
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
              badgeUri: resultBadgeUri,
              levelThresholds,
              badgeLevelImageURIs,
              badgeLevelNames,
              badgeLevelDescriptions,
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
    },
    [fetchContractData]
  );

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
    badgeLevelImageURIs,
    badgeLevelNames,
    badgeLevelDescriptions,
  };
};
