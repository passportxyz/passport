import { ethers, JsonRpcProvider } from "ethers";
import { useState, useEffect } from "react";
import PassportScoreScrollBadgeAbi from "../abi/PassportScoreScrollBadge.json";
import { datadogLogs } from "@datadog/browser-logs";

export const useScrollBadge = (address: string | undefined, contractAddresses: string[], rpcUrl: string) => {
  const [areBadgesLoading, setBadgesLoading] = useState<boolean>(true);
  const [badges, setBadges] = useState<{ contract: string; hasBadge: boolean; badgeLevel: number; badgeUri: string }[]>(
    []
  );
  const [errors, setErrors] = useState<{ [key: string]: string } | {}>({});

  useEffect(() => {
    if (!address) {
      datadogLogs.logger.error(
        `[Scroll-Campaign] Invalid address: ${contractAddresses}. Address: ${address}. RPC URL: ${rpcUrl}`
      );
      setErrors((prevErrors) => ({
        ...prevErrors,
        user_address: "Invalid address",
      }));
      setBadgesLoading(false);
      return;
    }

    if (contractAddresses.length < 1) {
      datadogLogs.logger.error(
        `[Scroll-Campaign] Invalid contractAddresses: ${contractAddresses}. Address: ${address}. RPC URL: ${rpcUrl}`
      );
      setErrors((prevErrors) => ({
        ...prevErrors,
        user_address: "Invalid address",
      }));
      setBadgesLoading(false);
      return;
    }

    const checkBadge = async (address: string | undefined) => {
      try {
        setBadgesLoading(true);
        const scrollRpcProvider = new JsonRpcProvider(rpcUrl);

        const badges = await Promise.all(
          contractAddresses.map(async (contractAddress) => {
            let resultHasBadge = false;
            let resultBadgeLevel = 0;
            let resultBadgeUri = "";
            try {
              console.log(`[Scroll-Campaign] Checking if ${address} has badge level for contract: ${contractAddress}`);
              datadogLogs.logger.info(
                `[Scroll-Campaign] Checking if ${address} has badge level for contract: ${contractAddress}`
              );
              const contract = new ethers.Contract(contractAddress, PassportScoreScrollBadgeAbi.abi, scrollRpcProvider);
              resultHasBadge = await contract.hasBadge(address);
              if (resultHasBadge) {
                // Get badge level
                try {
                  console.log(`[Scroll-Campaign] Checking badge level for contract: ${contractAddress}`);
                  datadogLogs.logger.info(`[Scroll-Campaign] Checking badge level for contract: ${contractAddress}`);
                  resultBadgeLevel = await contract.checkLevel(address);
                } catch (err) {
                  console.error(
                    `[Scroll-Campaign] Error checking badge level for contract ${contractAddress} : ${err}`
                  );
                  datadogLogs.logger.error(
                    `[Scroll-Campaign] Error checking badge level for contract ${contractAddress} : ${err}`
                  );
                  setErrors((prevErrors) => ({
                    ...prevErrors,
                    [`badge_level_${contractAddress}`]: "Failed to fetch badge level",
                  }));
                }
                // Get badge uri
                try {
                  console.log("Checking badge uri for contract: ", contractAddress);
                  datadogLogs.logger.info(`[Scroll-Campaign] Checking badge uri for contract ${contractAddress}`);
                  resultBadgeUri = await contract.badgeLevelImageURIs(resultBadgeLevel);
                } catch (err) {
                  console.error("Error getting badge uri for contract", contractAddress, ":", err);
                  datadogLogs.logger.error(
                    `[Scroll-Campaign] Error getting badge uri for contract ${contractAddress} : ${err}`
                  );
                  setErrors((prevErrors) => ({
                    ...prevErrors,
                    [`badge_uri_${contractAddress}`]: "Failed to fetch badge uri",
                  }));
                }
              }
            } catch (err) {
              console.error("Error checking badge for contract", contractAddress, ":", err);
              datadogLogs.logger.error(
                `[Scroll-Campaign] Error hecking if ${address} has badge level for contract: ${contractAddress}. Err : ${err}`
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
    };

    checkBadge(address);
  }, [address, contractAddresses, rpcUrl]);

  // Check if user has at least one badge
  const hasAtLeastOneBadge = badges.some((badge) => badge.hasBadge);

  return { badges, areBadgesLoading, errors, hasAtLeastOneBadge };
};
