// Utility function to handle Human Wallet logout
export const logoutHumanWallet = async (): Promise<void> => {
  if (typeof window !== "undefined" && (window as any).silk) {
    try {
      const silk = (window as any).silk;
      if (silk.logout && typeof silk.logout === "function") {
        console.log("Logging out from Human Wallet...");
        await silk.logout();
      }
    } catch (error) {
      console.error("Error logging out from Human Wallet:", error);
    }
  }
};
