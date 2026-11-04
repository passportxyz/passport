import { useCallback, useMemo } from "react";
import { useConnections } from "wagmi";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { LinkedWalletInfo, WaaPEthereumProviderInterface } from "@human.tech/waap-sdk";
import { isWaaPConnector } from "../utils/waap";

// Wallets linked to the signed-in WaaP (Human Wallet) account, managed through the WaaP SDK.
// WaaP only accepts link signatures from domains on its allowlist (SIWE_ALLOWED_DOMAINS_LINKED_WALLETS).
// It reads the WaaP connection itself, not wagmi's active one: linking briefly makes the linked
// wallet active (see walletLinkingGuard.ts), and the WaaP account must stay in use meanwhile.
export const useLinkedWallets = () => {
  const connections = useConnections();
  const waapConnection = connections.find(({ connector }) => isWaaPConnector(connector));
  const connector = waapConnection?.connector;
  const queryClient = useQueryClient();
  /** The WaaP account the linked wallets belong to. */
  const account = waapConnection?.accounts[0];
  const enabled = !!account;
  const accountKey = account?.toLowerCase();
  const queryKey = useMemo(() => ["waap-linked-wallets", accountKey], [accountKey]);

  const getProvider = useCallback(
    async () => (await connector!.getProvider()) as WaaPEthereumProviderInterface,
    [connector]
  );

  // Every wallet on the account: active ones, and ones parked after an unlink (unlinkAt set) that
  // can still be restored until their cooldown ends.
  const { data, error, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: async () => (await getProvider()).getLinkedWallets(),
    enabled,
    // Pick up wallets linked or unlinked in the Human Wallet app when the user comes back.
    refetchOnWindowFocus: true,
  });

  const wallets: LinkedWalletInfo[] = data ?? [];
  /** Active wallets: these count, and the 5-wallet limit applies to them. */
  const addresses = useMemo(() => wallets.filter((w) => w.unlinkAt === null).map((w) => w.address), [wallets]);
  /** Wallets parked after an unlink, with the time each is removed. */
  const parked = useMemo(
    () => wallets.filter((w): w is LinkedWalletInfo & { unlinkAt: string } => w.unlinkAt !== null),
    [wallets]
  );

  // link and unlink answer with active addresses only, so re-read the full list (an unlinked wallet
  // stays, parked with its unlinkAt).
  const reload = useCallback(() => queryClient.invalidateQueries({ queryKey }), [queryClient, queryKey]);

  // Asks the wallet at `linkedAddress` (connected via connectWalletToLink) to sign the link message.
  const link = useCallback(
    async (linkedAddress: string) => {
      await (await getProvider()).linkAddress(linkedAddress);
      await reload();
    },
    [getProvider, reload]
  );

  const unlink = useCallback(
    async (linkedAddress: string) => {
      await (await getProvider()).unlinkAddress(linkedAddress);
      await reload();
    },
    [getProvider, reload]
  );

  // Brings a parked wallet back before its cooldown ends. WaaP refuses it (422) when that would go
  // over the account's limit of active wallets.
  const restore = useCallback(
    async (parkedAddress: string) => {
      const updated = await (await getProvider()).cancelUnlink(parkedAddress);
      queryClient.setQueryData(queryKey, updated);
    },
    [getProvider, queryClient, queryKey]
  );

  return {
    /** False when the user isn't signed in with WaaP; linking needs a WaaP account. */
    enabled,
    account,
    /** The WaaP connector's uid, to make it the active connection again after linking. */
    connectorUid: connector?.uid,
    addresses,
    parked,
    error,
    isLoading: enabled && isLoading,
    refetch,
    link,
    unlink,
    restore,
  };
};
