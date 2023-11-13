import axios from "axios";
import { useCallback, useMemo, useState } from "react";
import { datadogRum } from "@datadog/browser-rum";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";

export type SupportBannerProps = {
  content: string;
  link: string;
  banner_id: number;
  dismiss: () => Promise<void>;
};

export const useSupportBanners = (): { banners: SupportBannerProps[]; loadBanners: () => Promise<void> } => {
  const [banners, setBanners] = useState<SupportBannerProps[]>([]);

  const { dbAccessToken, dbAccessTokenStatus } = useDatastoreConnectionContext();

  const loadBanners = useCallback(async () => {
    if (dbAccessTokenStatus === "connected" && dbAccessToken) {
      const banners: {
        data: Omit<SupportBannerProps, "dismiss">[];
      } = await axios.get(`${process.env.NEXT_PUBLIC_SCORER_ENDPOINT}/passport-admin/banners`, {
        headers: {
          Authorization: `Bearer ${dbAccessToken}`,
        },
      });

      setBanners(
        banners.data.map((banner: Omit<SupportBannerProps, "dismiss">) => ({
          ...banner,
          dismiss: creatDismissSupportBannerCallback(banner.banner_id),
        }))
      );
    }
  }, [dbAccessToken, dbAccessTokenStatus]);

  const creatDismissSupportBannerCallback = (banner_id: number) => async () => {
    try {
      if (!dbAccessToken) throw new Error("No access token");
      await axios.post(
        `${process.env.NEXT_PUBLIC_SCORER_ENDPOINT}/passport-admin/banners/${banner_id}/dismiss`,
        {},
        {
          headers: {
            Authorization: `Bearer ${dbAccessToken}`,
          },
        }
      );
      setBanners((oldBanners) => oldBanners.filter((banner) => banner.banner_id !== banner_id));
    } catch (err) {
      datadogRum.addError(err);
    }
  };

  return useMemo(() => ({ banners, loadBanners }), [banners, loadBanners]);
};
