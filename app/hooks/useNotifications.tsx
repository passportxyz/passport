import { useEffect, useState } from "react";
import axios from "axios";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useOnChainData } from "./useOnChainData";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { debug } from "console";
import { chains } from "../utils/chains";
import { useCustomization } from "./useCustomization";

export type Notification = {
  notification_id: string;
  type: "custom" | "stamp_expiry" | "on_chain_expiry" | "deduplication";
  content: string;
  is_read: boolean;
  link: string | undefined;
  link_text: string | undefined;
};

type Notifications = {
  items: Notification[];
};

type ExpiredChain = {
  id: string;
  name: string;
};

const fetchNotifications = async (expiredChains?: ExpiredChain[], dbAccessToken?: string, scorerId?: number) => {
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_SCORER_ENDPOINT}/passport-admin/notifications`,
    {
      expired_chain_ids: expiredChains || [],
      scorer_id: scorerId || process.env.NEXT_PUBLIC_CERAMIC_CACHE_SCORER_ID,
    },
    {
      headers: {
        Authorization: `Bearer ${dbAccessToken}`,
      },
    }
  );
  return res.data;
};

const dismissNotification = async (
  notification_id: string,
  dismissalType: "delete" | "read",
  dbAccessToken?: string
) => {
  if (!dbAccessToken) return;
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_SCORER_ENDPOINT}/passport-admin/notifications/${notification_id}`,
    { dismissal_type: dismissalType },
    {
      headers: {
        Authorization: `Bearer ${dbAccessToken}`,
      },
    }
  );

  return res.data;
};

export const useDismissNotification = (notification_id: string, dismissalType: "delete" | "read") => {
  const { dbAccessToken } = useDatastoreConnectionContext();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => dismissNotification(notification_id, dismissalType, dbAccessToken),
    onSuccess: () => {
      const { items }: Notifications = queryClient.getQueryData(["notifications"]) || { items: [] };
      const updatedNotifications =
        dismissalType === "delete"
          ? items.filter((notification) => notification.notification_id !== notification_id)
          : items.map((notification) =>
              notification.notification_id === notification_id ? { ...notification, is_read: true } : notification
            );

      queryClient.setQueryData(["notifications"], { items: updatedNotifications });
    },
  });
};

export const useNotifications = () => {
  const { dbAccessTokenStatus, dbAccessToken } = useDatastoreConnectionContext();
  const { scorer } = useCustomization();
  const { data: onChainData } = useOnChainData();

  const [expiredChains, setExpiredChains] = useState<ExpiredChain[] | undefined>();

  useEffect(() => {
    if (!onChainData) return;
    const expiredChains = Object.keys(onChainData).reduce<ExpiredChain[]>((acc, chainId) => {
      const data = onChainData[chainId];
      if (data?.expirationDate && data.expirationDate.getTime() < new Date().getTime()) {
        const name = chains.find((chain) => chain.id === chainId)?.label || "";
        acc.push({ id: chainId, name });
      }
      return acc;
    }, []);

    setExpiredChains(expiredChains);
  }, [onChainData]);

  const { data: notifications, error } = useQuery<Notifications, Error>({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(expiredChains, dbAccessToken, scorer?.id),
    enabled: !!dbAccessToken && dbAccessTokenStatus === "connected" && expiredChains !== undefined,
  });

  return {
    error,
    notifications: notifications?.items || [],
  };
};
