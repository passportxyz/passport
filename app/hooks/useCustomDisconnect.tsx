import { useDisconnect } from "wagmi";
import { logoutHumanWallet } from "../utils/humanWallet";

export const useCustomDisconnect = () => {
  const { disconnectAsync: wagmiDisconnect } = useDisconnect();

  const disconnect = async () => {
    // Disconnect first, so the app logs out at once. The Human Wallet (WaaP) logout is a round trip
    // to its iframe; it runs in the background and is shared with the WaaP connector's own logout.
    await wagmiDisconnect();
    void logoutHumanWallet();
  };

  return { disconnect };
};
