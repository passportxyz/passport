import React, { useEffect, useRef, useState } from "react";
import { WalletIcon } from "@heroicons/react/20/solid";
import {
  PassportLoadingVisual,
  passportWalletArtwork,
  WalletLinking,
  type LinkedWallet,
  type WalletLinkingStep,
  type WalletTypeOption,
} from "@human.tech/ui/passport";
import { useLinkedWallets } from "../../hooks/useLinkedWallets";
import { useMessage } from "../../hooks/useMessage";
import { useLinkedWalletScores } from "../../hooks/useLinkedWalletScores";
import { useWalletContribution } from "./walletContribution";
import {
  classifyLinkError,
  connectWalletToLink,
  disconnectWalletToLink,
  restoreActiveConnection,
  holdActiveConnection,
  LINK_LIMIT_MESSAGE,
  MAX_LINKED_WALLETS,
} from "../../utils/waapLinking";
import { setWalletLinkInProgress } from "../../utils/walletLinkingGuard";

// The SDK connects the wallet being linked through WalletConnect's own picker (browser extensions
// and mobile wallets), so the design-system picker offers a single entry into it.
const LINK_ANOTHER_WALLET: WalletTypeOption = {
  type: "walletconnect",
  icon: <WalletIcon width={18} height={18} />,
  tint: "sky",
  title: "Browser or mobile wallet",
  subtitle: "MetaMask, Rabby, WalletConnect and more",
};

// The animated glass loader the design system's Passport walkthrough uses for wait steps
// (PASSPORT_LOADING_MOTION in @human.tech/ui, not exported). Served from public/graphics.
const PASSPORT_LOADING_MOTION = "/graphics/passport-glass/humantech-loading-motion.webp";
const WAIT_LABELS = {
  connecting: "Connecting wallet",
  sign: "Waiting for wallet signature",
  pending: "Verifying wallet signature",
} as const;

// WaaP returns addresses only; each wallet's score, points and credentials come from the scorer
// (useLinkedWalletScores). "…" while they load and "-" if they couldn't be loaded, never a made-up 0.
const toLinkedWallet = (address: string, scores?: ReturnType<typeof useLinkedWalletScores>[number]): LinkedWallet => {
  const placeholder = scores?.isError ? "-" : "…";
  return {
    id: address.toLowerCase(),
    address,
    ecosystem: "ethereum",
    provider: "generic",
    score: scores?.data?.score ?? placeholder,
    points: scores?.data?.points ?? placeholder,
    creds: scores?.data?.creds ?? placeholder,
  };
};

export const PassportWalletLinking = ({
  accountIdentifier,
  onExit,
}: {
  accountIdentifier: string;
  onExit: () => void;
}) => {
  const { addresses, parked, error: loadError, connectorUid, link, unlink, restore } = useLinkedWallets();
  // Active wallets first, then those parked after an unlink (restorable until their cooldown ends).
  const shownAddresses = [...addresses, ...parked.map((w) => w.address)];
  const scores = useLinkedWalletScores(shownAddresses);
  const contributionFor = useWalletContribution();
  const { failure } = useMessage();
  const atLinkLimit = addresses.length >= MAX_LINKED_WALLETS;
  const showLinkLimit = () => failure({ title: "Linked wallet limit reached", message: LINK_LIMIT_MESSAGE });
  // Controlled, so the component's demo timers never run a fake link.
  const [step, setStep] = useState<WalletLinkingStep>("management");
  const [pendingWallet, setPendingWallet] = useState<LinkedWallet>();
  const linking = useRef(false);
  const backToList = () => (step === "management" ? onExit() : setStep("management"));

  // A failed load leaves the list empty, and the design system's empty state reads "No linked
  // wallets yet". Say it failed instead, once per error.
  useEffect(() => {
    if (!loadError) return;
    console.error("Error loading linked wallets", loadError);
    failure({ title: "Couldn't load your linked wallets", message: "Refresh the page to try again." });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadError]);

  // Restore a wallet parked by an unlink. WaaP refuses it when that would go over the active-wallet
  // limit (422, as for a sixth link) or when there's nothing left to restore.
  const restoreWallet = async (wallet: LinkedWallet) => {
    try {
      await restore(wallet.address);
    } catch (error) {
      console.error("Error restoring wallet", error);
      if (classifyLinkError(error) === "limit") {
        showLinkLimit();
      } else {
        failure({ title: "Couldn't restore this wallet", message: "Please try again." });
      }
    }
  };

  // connect the wallet → it signs the SIWE link message → WaaP records the link.
  const startLink = async () => {
    // A second click while a link runs would open a second connect window.
    if (linking.current) return;
    linking.current = true;
    // Connecting the wallet to link makes it wagmi's active connection for a moment; don't treat
    // that as an account switch (which logs the user out) until restoreActiveConnection undoes it.
    setWalletLinkInProgress(true);
    const releaseActiveConnection = connectorUid ? holdActiveConnection(connectorUid) : undefined;
    setStep("connecting");
    try {
      const walletAddress = await connectWalletToLink();
      setPendingWallet(toLinkedWallet(walletAddress));
      setStep("sign");
      await link(walletAddress);
      setStep("success");
    } catch (error) {
      console.error("Error linking wallet", error);
      const linkFailure = classifyLinkError(error);
      if (linkFailure === "limit") {
        // The design system has no limit screen; back to the list, with the reason.
        showLinkLimit();
        setStep("management");
      } else {
        setStep(linkFailure === "cancelled" ? "picker" : linkFailure === "conflict" ? "error409" : "errorGeneric");
      }
    } finally {
      releaseActiveConnection?.();
      try {
        await disconnectWalletToLink();
        if (connectorUid) await restoreActiveConnection(connectorUid);
      } catch (error) {
        console.error("Could not restore the WaaP connection after linking", error);
      } finally {
        // Always lift the guard, or the account-switch logout would stay off for the session.
        setWalletLinkInProgress(false);
        linking.current = false;
      }
    }
  };

  return (
    <WalletLinking
      {...passportWalletArtwork}
      brand="passport"
      disablePortal
      renderWaitVisual={(waitStep) => (
        <PassportLoadingVisual motionSrc={PASSPORT_LOADING_MOTION} label={WAIT_LABELS[waitStep]} />
      )}
      accountIdentifier={accountIdentifier}
      wallets={[
        ...addresses.map((address, i) => toLinkedWallet(address, scores[i])),
        // Parked after an unlink: shown with the date WaaP removes them ("Relink {date}") and Restore.
        ...parked.map(({ address, unlinkAt }, i) => ({
          ...toLinkedWallet(address, scores[addresses.length + i]),
          status: "cooldown" as const,
          cooldownEndsAt: unlinkAt,
        })),
      ]}
      enableCooldown
      // At the limit the design system disables "Link a New Wallet" and says why. Wallets in
      // cooldown don't count. The onStepChange guard below stays as a backstop.
      maxWallets={MAX_LINKED_WALLETS}
      onRestore={restoreWallet}
      contributionsFor={(wallet) =>
        contributionFor(scores.find((s) => s.address.toLowerCase() === wallet.id)?.data?.stamps)
      }
      walletTypes={[LINK_ANOTHER_WALLET]}
      pendingWallet={pendingWallet}
      step={step}
      onStepChange={(next) => {
        // At the cap, don't send the user through connect and sign only for WaaP to refuse (as the
        // WaaP app does): "Link a New Wallet" opens intro, "Link another wallet" opens the picker.
        if (atLinkLimit && (next === "intro" || next === "picker")) {
          showLinkLimit();
          setStep("management");
          return;
        }
        setStep(next);
      }}
      onConnect={startLink}
      onUnlink={(wallet) => unlink(wallet.address)}
      onClose={backToList}
      onDone={backToList}
    />
  );
};
