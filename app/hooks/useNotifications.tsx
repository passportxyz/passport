import { useEffect, useState } from "react";
import axios from "axios";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useOnChainData } from "./useOnChainData";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type Notification = {
  notification_id: string;
  type: "Custom" | "Expiry" | "OnChainExpiry" | "Deduplication";
  content: string;
  dismissed: boolean;
};

const fetchNotifications = async (expiredChainIds?: string[], dbAccessToken?: string) => {
  if (!dbAccessToken || !expiredChainIds) return;
  const res = await axios.post(
    `${process.env.NEXT_PUBLIC_SCORER_ENDPOINT}/passport-admin/notifications`,
    {
      expired_chain_ids: expiredChainIds,
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
  const res = await axios.patch(
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
      const currentNotifications: Notification[] = queryClient.getQueryData(["notifications"]) || [];
      const updatedNotifications =
        dismissalType === "delete"
          ? currentNotifications.filter((notification) => notification.notification_id !== notification_id)
          : currentNotifications.map((notification) =>
              notification.notification_id === notification_id ? { ...notification, dismissed: true } : notification
            );

      queryClient.setQueryData(["notifications"], updatedNotifications);
    },
  });
};

export const useNotifications = () => {
  const { dbAccessTokenStatus, dbAccessToken } = useDatastoreConnectionContext();
  const { data: onChainData } = useOnChainData();

  const [expiredChainIds, setExpiredChainIds] = useState<string[] | undefined>();

  useEffect(() => {
    if (!onChainData || !onChainData.data) return;
    const expiredIds = Object.keys(onChainData).reduce<string[]>((acc, chainId) => {
      const data = onChainData[chainId];
      if (data?.expirationDate && data.expirationDate.getTime() < new Date().getTime()) {
        acc.push(chainId);
      }
      return acc;
    }, []);

    setExpiredChainIds(expiredIds);
  }, [onChainData]);

  const { data: notifications, error } = useQuery<Notification[], Error>({
    queryKey: ["notifications"],
    queryFn: () => fetchNotifications(expiredChainIds, dbAccessToken),
    enabled: !!dbAccessToken && !!expiredChainIds?.length && dbAccessTokenStatus === "connected",
  });

  return {
    error,
    notifications,
  };
};
