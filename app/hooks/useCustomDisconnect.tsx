import { useDisconnect } from "@reown/appkit/react";
import { logoutHumanWallet } from "../utils/humanWallet";

export const useCustomDisconnect = () => {
  const { disconnect: wagmiDisconnect } = useDisconnect();

  const disconnect = async () => {
    // Handle Human Wallet logout if it's connected
    await logoutHumanWallet();

    // Then do the standard wagmi disconnect
    await wagmiDisconnect();
  };

  return { disconnect };
};
