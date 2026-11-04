import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, act, waitFor } from "@testing-library/react";

const linkMock = vi.fn();
const unlinkMock = vi.fn();
const connectWalletToLinkMock = vi.fn();
const disconnectWalletToLinkMock = vi.fn();
const restoreActiveConnectionMock = vi.fn();
const releaseActiveConnectionMock = vi.fn();
const holdActiveConnectionMock = vi.fn();
const failureToastMock = vi.fn();
let mockAddresses: string[] = [];
let mockParked: { address: string; unlinkAt: string }[] = [];
let mockLoadError: unknown = null;
const restoreMock = vi.fn();
let lastProps: any;

vi.mock("../../../hooks/useLinkedWallets", () => ({
  useLinkedWallets: () => ({
    addresses: mockAddresses,
    parked: mockParked,
    error: mockLoadError,
    connectorUid: "waap-uid",
    link: linkMock,
    unlink: unlinkMock,
    restore: restoreMock,
  }),
}));
vi.mock("../../../hooks/useMessage", () => ({ useMessage: () => ({ failure: failureToastMock }) }));
let mockScores: {
  data?: { score: string; points: string; creds: string; stamps?: unknown[] };
  isLoading: boolean;
  isError: boolean;
}[] = [];
const contributionForMock = vi.fn((stamps?: unknown[]) => ({ stamps: stamps ?? [], credentials: [] }));
vi.mock("../../../components/LinkedWallets/walletContribution", () => ({
  useWalletContribution: () => contributionForMock,
}));
vi.mock("../../../hooks/useLinkedWalletScores", () => ({
  useLinkedWalletScores: (addresses: string[]) =>
    addresses.map((address, i) => ({ address, ...(mockScores[i] ?? { isLoading: true, isError: false }) })),
}));
// The real waapLinking module (error classification) runs; only its SDK calls are replaced.
vi.mock("@human.tech/waap-sdk", () => ({ WaaPWalletConnect: {} }));
vi.mock("../../../utils/waapLinking", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../utils/waapLinking")>()),
  connectWalletToLink: () => connectWalletToLinkMock(),
  disconnectWalletToLink: () => disconnectWalletToLinkMock(),
  restoreActiveConnection: (uid: string) => restoreActiveConnectionMock(uid),
  holdActiveConnection: (uid: string) => holdActiveConnectionMock(uid),
}));
vi.mock("@human.tech/ui/passport", () => ({
  PassportLoadingVisual: () => null,
  passportWalletArtwork: {},
  WalletLinking: (props: any) => {
    lastProps = props;
    return <div data-testid="wallet-linking">{props.step}</div>;
  },
}));

import { PassportWalletLinking } from "../../../components/LinkedWallets/PassportWalletLinking";
import { LinkCancelledError } from "../../../utils/waapLinking";
import { isWalletLinkInProgress } from "../../../utils/walletLinkingGuard";

const LINKED = "0xAbC0000000000000000000000000000000000001";
const NEW_WALLET = "0xDef0000000000000000000000000000000000002";

describe("PassportWalletLinking", () => {
  const onExit = vi.fn();

  beforeEach(() => {
    [
      linkMock,
      unlinkMock,
      connectWalletToLinkMock,
      disconnectWalletToLinkMock,
      restoreActiveConnectionMock,
      releaseActiveConnectionMock,
      holdActiveConnectionMock,
      failureToastMock,
      onExit,
    ].forEach((m) => m.mockReset());
    connectWalletToLinkMock.mockResolvedValue(NEW_WALLET);
    holdActiveConnectionMock.mockReturnValue(releaseActiveConnectionMock);
    mockAddresses = [LINKED];
    mockParked = [];
    mockLoadError = null;
    restoreMock.mockReset();
    mockScores = [];
    lastProps = undefined;
  });

  const renderLinking = () => render(<PassportWalletLinking accountIdentifier="0xme" onExit={onExit} />);

  it("shows WaaP's linked addresses as wallets on the management screen", () => {
    renderLinking();
    expect(lastProps.step).toBe("management");
    expect(lastProps.accountIdentifier).toBe("0xme");
    expect(lastProps.wallets).toEqual([
      expect.objectContaining({ id: LINKED.toLowerCase(), address: LINKED, ecosystem: "ethereum" }),
    ]);
  });

  // Each wallet's own numbers from the scorer; never a made-up 0 while loading or after a failure.
  it("shows each wallet's score, points and credentials from the scorer", () => {
    mockScores = [{ data: { score: "23.5", points: "250", creds: "2" }, isLoading: false, isError: false }];
    renderLinking();
    expect(lastProps.wallets[0]).toEqual(expect.objectContaining({ score: "23.5", points: "250", creds: "2" }));
  });

  // "View details" lists the stamps that count on that wallet, not another wallet's.
  it("gives the wallet details screen that wallet's own stamps", () => {
    mockAddresses = [LINKED, NEW_WALLET];
    const linkedStamps = [{ provider: "Google", points: "0.5", expires: null }];
    const newStamps = [{ provider: "Github", points: "1.2", expires: null }];
    mockScores = [
      { data: { score: "0.5", points: "0", creds: "1", stamps: linkedStamps }, isLoading: false, isError: false },
      { data: { score: "1.2", points: "0", creds: "1", stamps: newStamps }, isLoading: false, isError: false },
    ];
    renderLinking();

    expect(lastProps.contributionsFor(lastProps.wallets[1]).stamps).toBe(newStamps);
    expect(lastProps.contributionsFor(lastProps.wallets[0]).stamps).toBe(linkedStamps);
  });

  it("shows … while a wallet's score loads and - if it fails", () => {
    mockAddresses = [LINKED, NEW_WALLET];
    mockScores = [
      { isLoading: true, isError: false },
      { isLoading: false, isError: true },
    ];
    renderLinking();
    expect(lastProps.wallets[0]).toEqual(expect.objectContaining({ score: "…", points: "…", creds: "…" }));
    expect(lastProps.wallets[1]).toEqual(expect.objectContaining({ score: "-", points: "-", creds: "-" }));
  });

  // The design system disables "Link a New Wallet" with the reason once WaaP's limit is reached.
  it("gives the design system WaaP's limit of 5 linked wallets", () => {
    renderLinking();

    expect(lastProps.maxWallets).toBe(5);
  });

  // A failed load leaves the list empty, which reads as "No linked wallets yet". Say it failed instead.
  it("says the linked wallets couldn't be loaded when WaaP's list fails", () => {
    mockAddresses = [];
    mockLoadError = new Error("Unsupported method: waap_getLinkedWallets");
    renderLinking();

    expect(failureToastMock).toHaveBeenCalledTimes(1);
    expect(failureToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Couldn't load your linked wallets" })
    );
  });

  it("shows no load error when the list loads", () => {
    mockAddresses = [];
    renderLinking();

    expect(failureToastMock).not.toHaveBeenCalled();
  });

  // Wallets parked after an unlink stay listed until their cooldown ends, with that date and Restore.
  it("lists parked wallets after the active ones, in cooldown with their own relink date", () => {
    mockParked = [{ address: NEW_WALLET, unlinkAt: "2026-12-04T12:00:00.000Z" }];
    renderLinking();

    expect(lastProps.enableCooldown).toBe(true);
    expect(lastProps.wallets).toEqual([
      expect.objectContaining({ address: LINKED }),
      expect.objectContaining({ address: NEW_WALLET, status: "cooldown", cooldownEndsAt: "2026-12-04T12:00:00.000Z" }),
    ]);
    // The active wallet carries no cooldown state.
    expect(lastProps.wallets[0]).not.toHaveProperty("status");
    expect(lastProps.wallets[0]).not.toHaveProperty("cooldownEndsAt");
  });

  it("restores a parked wallet through WaaP", async () => {
    mockParked = [{ address: NEW_WALLET, unlinkAt: "2026-12-04T12:00:00.000Z" }];
    renderLinking();

    await act(async () => lastProps.onRestore(lastProps.wallets[1]));

    expect(restoreMock).toHaveBeenCalledWith(NEW_WALLET);
    expect(failureToastMock).not.toHaveBeenCalled();
  });

  // WaaP refuses a restore that would make a sixth active wallet (422).
  it("shows the wallet limit when WaaP refuses a restore at the cap", async () => {
    restoreMock.mockRejectedValue({ error: "This account already has the maximum of 5 linked wallets" });
    mockParked = [{ address: NEW_WALLET, unlinkAt: "2026-12-04T12:00:00.000Z" }];
    renderLinking();

    await act(async () => lastProps.onRestore(lastProps.wallets[1]));

    expect(failureToastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Linked wallet limit reached" }));
  });

  it("says a restore failed for any other reason", async () => {
    restoreMock.mockRejectedValue({ error: "Address has no pending unlink to cancel" });
    mockParked = [{ address: NEW_WALLET, unlinkAt: "2026-12-04T12:00:00.000Z" }];
    renderLinking();

    await act(async () => lastProps.onRestore(lastProps.wallets[1]));

    expect(failureToastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Couldn't restore this wallet" }));
  });

  // The 5-wallet limit counts active wallets only; parked ones don't take a slot.
  it("doesn't count parked wallets toward the link limit", () => {
    mockAddresses = [1, 2, 3, 4].map((n) => `0x${String(n).repeat(40)}`);
    mockParked = [{ address: NEW_WALLET, unlinkAt: "2026-12-04T12:00:00.000Z" }];
    renderLinking();

    act(() => lastProps.onStepChange("picker"));

    expect(lastProps.step).toBe("picker");
  });

  it("unlinks through WaaP with the wallet's address", async () => {
    renderLinking();
    await lastProps.onUnlink(lastProps.wallets[0]);
    expect(unlinkMock).toHaveBeenCalledWith(LINKED);
  });

  it("links the connected wallet: connecting, then sign, then success", async () => {
    let finishLink!: () => void;
    linkMock.mockReturnValue(new Promise<void>((resolve) => (finishLink = resolve)));
    renderLinking();

    act(() => {
      void lastProps.onConnect("walletconnect");
    });
    await waitFor(() => expect(lastProps.step).toBe("sign"));
    expect(lastProps.pendingWallet).toEqual(expect.objectContaining({ address: NEW_WALLET }));
    expect(linkMock).toHaveBeenCalledWith(NEW_WALLET);

    await act(async () => finishLink());
    await waitFor(() => expect(lastProps.step).toBe("success"));
    expect(disconnectWalletToLinkMock).toHaveBeenCalled();
  });

  it("returns to the picker when the user closes the connect window", async () => {
    connectWalletToLinkMock.mockRejectedValue(new LinkCancelledError());
    renderLinking();
    act(() => {
      void lastProps.onConnect("walletconnect");
    });
    await waitFor(() => expect(lastProps.step).toBe("picker"));
    expect(linkMock).not.toHaveBeenCalled();
    expect(disconnectWalletToLinkMock).toHaveBeenCalled();
  });

  it("shows the already-linked screen for WaaP's conflict error", async () => {
    linkMock.mockRejectedValue({ error: "Address is already linked to another account" });
    renderLinking();
    act(() => {
      void lastProps.onConnect("walletconnect");
    });
    await waitFor(() => expect(lastProps.step).toBe("error409"));
  });

  it("shows the generic error screen for any other failure", async () => {
    linkMock.mockRejectedValue(new Error("link 400 invalid domain"));
    renderLinking();
    act(() => {
      void lastProps.onConnect("walletconnect");
    });
    await waitFor(() => expect(lastProps.step).toBe("errorGeneric"));
  });

  // Connecting the wallet to link makes it wagmi's active connection; that must not log the user
  // out, and the WaaP connection must be active again afterwards.
  it("holds off the account-switch logout while linking, then restores the WaaP connection", async () => {
    let flagWhileConnecting: boolean | undefined;
    connectWalletToLinkMock.mockImplementation(async () => {
      flagWhileConnecting = isWalletLinkInProgress();
      return NEW_WALLET;
    });
    renderLinking();
    act(() => {
      void lastProps.onConnect("walletconnect");
    });
    await waitFor(() => expect(lastProps.step).toBe("success"));

    expect(flagWhileConnecting).toBe(true);
    await waitFor(() => expect(restoreActiveConnectionMock).toHaveBeenCalledWith("waap-uid"));
    await waitFor(() => expect(isWalletLinkInProgress()).toBe(false));
  });

  // WaaP allows 5 active linked wallets. At the cap, linking stops before connect and sign.
  const FIVE = [1, 2, 3, 4, 5].map((n) => `0x${String(n).repeat(40)}`);

  it.each(["intro", "picker"] as const)("blocks opening %s at the 5-wallet limit, with the reason", (next) => {
    mockAddresses = FIVE;
    renderLinking();

    act(() => lastProps.onStepChange(next));

    expect(lastProps.step).toBe("management");
    expect(failureToastMock).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringMatching(/up to 5 linked wallets/) })
    );
  });

  it("still opens the picker below the limit", () => {
    mockAddresses = FIVE.slice(0, 4);
    renderLinking();

    act(() => lastProps.onStepChange("picker"));

    expect(lastProps.step).toBe("picker");
    expect(failureToastMock).not.toHaveBeenCalled();
  });

  // The auth server's 422 arrives as a bare string.
  it("returns to the list with the limit reason when WaaP refuses a 6th wallet", async () => {
    linkMock.mockRejectedValue("This account already has the maximum of 5 linked wallets");
    renderLinking();
    act(() => {
      void lastProps.onConnect("walletconnect");
    });

    await waitFor(() => expect(lastProps.step).toBe("management"));
    expect(failureToastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Linked wallet limit reached" }));
  });

  // The wallet being linked must never become the active account, so the header keeps showing the
  // logged-in address: the hold covers the whole connect and sign, and is released afterwards.
  it("keeps the WaaP connection active for the whole link", async () => {
    let heldWhileConnecting = false;
    let releasedBeforeSigning = false;
    connectWalletToLinkMock.mockImplementation(async () => {
      heldWhileConnecting = holdActiveConnectionMock.mock.calls.length === 1;
      return NEW_WALLET;
    });
    linkMock.mockImplementation(async () => {
      releasedBeforeSigning = releaseActiveConnectionMock.mock.calls.length > 0;
    });
    renderLinking();
    act(() => {
      void lastProps.onConnect("walletconnect");
    });
    await waitFor(() => expect(lastProps.step).toBe("success"));

    expect(holdActiveConnectionMock).toHaveBeenCalledWith("waap-uid");
    expect(heldWhileConnecting).toBe(true);
    expect(releasedBeforeSigning).toBe(false);
    await waitFor(() => expect(releaseActiveConnectionMock).toHaveBeenCalledTimes(1));
  });

  it("releases the hold after a failed link too", async () => {
    linkMock.mockRejectedValue(new Error("boom"));
    renderLinking();
    act(() => {
      void lastProps.onConnect("walletconnect");
    });
    await waitFor(() => expect(lastProps.step).toBe("errorGeneric"));
    await waitFor(() => expect(releaseActiveConnectionMock).toHaveBeenCalledTimes(1));
  });

  it("restores the WaaP connection and clears the guard after a failed link too", async () => {
    linkMock.mockRejectedValue(new Error("boom"));
    renderLinking();
    act(() => {
      void lastProps.onConnect("walletconnect");
    });
    await waitFor(() => expect(lastProps.step).toBe("errorGeneric"));
    await waitFor(() => expect(restoreActiveConnectionMock).toHaveBeenCalledWith("waap-uid"));
    await waitFor(() => expect(isWalletLinkInProgress()).toBe(false));
  });

  it("closing a sub-screen returns to the list; closing the list exits", () => {
    renderLinking();
    act(() => lastProps.onStepChange("unlinkConfirm"));
    act(() => lastProps.onClose());
    expect(lastProps.step).toBe("management");
    expect(onExit).not.toHaveBeenCalled();

    act(() => lastProps.onClose());
    expect(onExit).toHaveBeenCalled();
  });
});
