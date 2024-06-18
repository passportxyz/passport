import { useContext, useEffect, useMemo, useState } from "react";
import { useOnChainStatus } from "./useOnChainStatus";
import { chains } from "../utils/chains";
import axios, { AxiosResponse } from "axios";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useOnChainData } from "./useOnChainData";

export type Notification = {
  notification_id: string;
  type: string;
  content: string;
  dismissed: boolean;
};

export const useNotifications = () => {
  const { dbAccessTokenStatus, dbAccessToken } = useDatastoreConnectionContext();
  const { data: onChainData } = useOnChainData();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expiredChainIds, setExpiredChainIds] = useState<string[] | undefined>();

  const fetchNotifications = useMemo(async () => {
    const expiredChainIds = Object.keys(onChainData).reduce<string[]>((acc, chainId) => {
      const data = onChainData[chainId];
      if (data?.expirationDate && data.expirationDate.getTime() < new Date().getTime()) {
        acc.push(chainId);
      }
      return acc;
    }, []);
    if (!dbAccessToken || dbAccessTokenStatus !== "connected" || expiredChainIds) return;
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_SCORER_ENDPOINT}/passport-admin/notifications`,
        {
          expiredChainIds,
        },
        {
          headers: {
            Authorization: `Bearer ${dbAccessToken}`,
          },
        }
      );
      setNotifications(response.data.notifications);
    } catch (error) {
      console.error("Error fetching notifications", error);
    }
  }, [dbAccessToken, dbAccessTokenStatus, onChainData]);

  const dismissNotification = async (notification_id: string, dismissalType: "delete" | "read") => {
    if (!dbAccessToken) return;
    try {
      const res = await axios.patch(
        `${process.env.NEXT_PUBLIC_SCORER_ENDPOINT}/passport-admin/notifications/${notification_id}`,
        { dismissal_type: dismissalType },
        {
          headers: {
            Authorization: `Bearer ${dbAccessToken}`,
          },
        }
      );
      if (res.status === 200) {
        const updatedNotifications =
          dismissalType === "delete"
            ? notifications.filter((notification) => notification.notification_id !== notification_id)
            : notifications.map((notification) =>
                notification.notification_id === notification_id ? { ...notification, dismissed: true } : notification
              );
        setNotifications(updatedNotifications);
      }
    } catch (error) {
      console.error("Error dismissing notification", error);
    }
  };

  return {
    dismissNotification,
    setExpiredChainIds,
    fetchNotifications,
  };
};
