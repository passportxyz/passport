import { useState, useEffect } from "react";


// returns a list of badges that the user has minted
const fetchUserBadgeStatus = async () => {
    // Check if user has any badges minted
}


// Custom hook to check badge minting status
export const useBadgeStatus = () => {
  const [badgesMinted, setBadgesMinted] = useState(false); 
  const [loading, setLoading] = useState(true);

  // Simulate badge status check
  useEffect(() => {
    const checkBadgeStatus = async () => {
      setLoading(true);
      const hasMintedBadges = await fetchUserBadgeStatus();
      setBadgesMinted(hasMintedBadges);
      setLoading(false);
    };

    checkBadgeStatus();
  }, []);

  return { badgesMinted, loading };
};


  