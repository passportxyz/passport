import { ethers, JsonRpcProvider } from "ethers";
import { useState, useEffect } from "react";
import PassportScoreScrollBadgeAbi from "../abi/PassportScoreScrollBadge.json";

const scrollRpcUrl = "https://scroll.drpc.org";
const scrollRpcProvider = new JsonRpcProvider(scrollRpcUrl);

export const useScrollBadge = (address: string | undefined) => {
  const [hasBadge, setHasBadge] = useState<boolean>(false);
  const [badgeLevel, setBadgeLevel] = useState<number>(0); // TODO: define badge level type
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkBadge = async (address: string | undefined) => {
      if (!address) {
        setError("Invalid address");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const contractAddress = "TODO";
        const scrollRpcUrl = "https://scroll.drpc.org";
        const scrollRpcProvider = new JsonRpcProvider(scrollRpcUrl);

        const contract = new ethers.Contract(contractAddress, PassportScoreScrollBadgeAbi.abi, scrollRpcProvider);

        const resultHasBadge = await contract.hasBadge(address);

        setHasBadge(resultHasBadge);
        if (resultHasBadge) {
          try {
            console.log("User has badge... checking level");
            const resultBadgeLevel = await contract.checkLevel(address);
            setBadgeLevel(resultBadgeLevel);
          } catch (err) {
            console.error("Error checking badge level:", err);
            setError("Failed to fetch badge level");
          }
        }
      } catch (err) {
        console.error("Error checking badge:", err);
        setError("Failed to fetch badge status");
      } finally {
        setLoading(false);
      }
    };

    checkBadge(address);
  }, [address]);

  return { hasBadge, badgeLevel, loading, error };
};
