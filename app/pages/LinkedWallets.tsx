import React, { useEffect } from "react";
import { AppShell } from "@human.tech/ui/core";
import PageRoot from "../components/PageRoot";
import Header from "../components/Header";
import WelcomeFooter from "../components/WelcomeFooter";
import { PassportWalletLinking } from "../components/LinkedWallets/PassportWalletLinking";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useNavigateToPage } from "../hooks/useCustomization";
import { useLinkedWallets } from "../hooks/useLinkedWallets";
import { isWalletLinkInProgress } from "../utils/walletLinkingGuard";

export default function LinkedWallets() {
  const navigateToPage = useNavigateToPage();
  const { dbAccessTokenStatus } = useDatastoreConnectionContext();
  // The WaaP account, not wagmi's active address: that briefly becomes the wallet being linked.
  const { account: address, enabled } = useLinkedWallets();

  // Linked wallets belong to a WaaP (Human Wallet) account, so other sign-ins go home.
  useEffect(() => {
    if (isWalletLinkInProgress()) return;
    if (!address || dbAccessTokenStatus !== "connected" || !enabled) {
      navigateToPage("home");
    }
  }, [address, dbAccessTokenStatus, enabled]);

  return (
    <PageRoot className="flex min-h-screen flex-col overflow-auto text-color-1">
      <Header skipCustomisation={true} />
      <div className="relative flex flex-1 items-center justify-center px-4 pb-24 pt-24 md:pb-16">
        {address && (
          <AppShell brand="passport" size="embed">
            <PassportWalletLinking accountIdentifier={address} onExit={() => navigateToPage("dashboard")} />
          </AppShell>
        )}
      </div>
      <WelcomeFooter displayPrivacyPolicy={true} />
    </PageRoot>
  );
}
