import { ethers, JsonRpcProvider } from "ethers";
import { useState, useEffect } from "react";
import PassportScoreScrollBadgeAbi from "../abi/PassportScoreScrollBadge.json";

export const useScrollBadge = (address: string | undefined, contractAddresses: string[], rpcUrl: string) => {
  const [areBadgesLoading, setBadgesLoading] = useState<boolean>(true);
  const [badges, setBadges] = useState<{ contract: string; hasBadge: boolean; badgeLevel: number; badgeUri: string }[]>(
    []
  );
  const [errors, setErrors] = useState<{ [key: string]: string } | {}>({});

  useEffect(() => {
    if (!address) {
      setErrors({
        ...errors,
        user_address: "Invalid address",
      });
      setBadgesLoading(false);
      return;
    }

    if (contractAddresses.length < 1) {
      setErrors({
        ...errors,
        user_address: "Invalid address",
      });
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
              const contract = new ethers.Contract(contractAddress, PassportScoreScrollBadgeAbi.abi, scrollRpcProvider);
              resultHasBadge = await contract.hasBadge(address);
              if (resultHasBadge) {
                // Get badge level
                try {
                  console.log("Checking badge level for contract: ", contractAddress);
                  resultBadgeLevel = await contract.checkLevel(address);
                } catch (err) {
                  console.error("Error checking badge level for contract", contractAddress, ":", err);
                  setErrors((prevErrors) => ({
                    ...prevErrors,
                    [`badge_level_${contractAddress}`]: "Failed to fetch badge level",
                  }));
                }
                // Get badge uri
                try {
                  console.log("Checking badge uri for contract: ", contractAddress);
                  resultBadgeUri = await contract.badgeLevelImageURIs(resultBadgeLevel);
                } catch (err) {
                  console.error("Error getting badge uri for contract", contractAddress, ":", err);
                  setErrors((prevErrors) => ({
                    ...prevErrors,
                    [`badge_uri_${contractAddress}`]: "Failed to fetch badge uri",
                  }));
                }
              }
            } catch (err) {
              console.error("Error checking badge for contract", contractAddress, ":", err);
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

        console.log("badges", badges);
      } catch (err) {
        console.error("Error checking badges:", err);
        setErrors((prevErrors) => ({
          ...prevErrors,
          fetch_badges: "Failed to fetch badges",
        }));
      } finally {
        setBadgesLoading(false);
      }
    };

    checkBadge(address);
  }, [address, contractAddresses, rpcUrl, errors]);

  // Check if user has at least one badge
  const hasAtLeastOneBadge = badges.some((badge) => badge.hasBadge);

  return { badges, areBadgesLoading, errors, hasAtLeastOneBadge };
};
