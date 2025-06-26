import axios from "axios";
import { useCallback, useMemo, useEffect } from "react";
import { datadogRum } from "@datadog/browser-rum";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";

export type SupportBannerProps = {
  content: string;
  link: string;
  banner_id: number;
  dismiss: () => Promise<void>;
};

type BannerStore = {
  banners: SupportBannerProps[];
  dismiss: (bannerId: number) => void;
  update: (banners: SupportBannerProps[]) => void;
};

const useBannerStore = create<BannerStore>((set) => ({
  banners: [],
  dismiss: (bannerId: number) =>
    set((state) => ({ banners: state.banners.filter((banner) => banner.banner_id !== bannerId) })),
  update: (banners: SupportBannerProps[]) => set((state) => ({ banners })),
}));

const fetchBanners = async (dbAccessToken: string | undefined, fnDismiss: (bannerId: number) => void) => {
  if (dbAccessToken) {
    const banners: {
      data: Omit<SupportBannerProps, "dismiss">[];
    } = await axios.get(`${process.env.NEXT_PUBLIC_SCORER_ENDPOINT}/passport-admin/banners`, {
      headers: {
        Authorization: `Bearer ${dbAccessToken}`,
      },
    });

    return banners.data.map((banner: Omit<SupportBannerProps, "dismiss">) => ({
      ...banner,
      dismiss: creatDismissSupportBannerCallback(dbAccessToken, banner.banner_id, fnDismiss),
    }));
  }
};

const creatDismissSupportBannerCallback =
  (dbAccessToken: string, bannerId: number, fnDismiss: (bannerId: number) => void) => async () => {
    fnDismiss(bannerId);
    try {
      if (!dbAccessToken) throw new Error("No access token");
      await axios.post(
        `${process.env.NEXT_PUBLIC_SCORER_ENDPOINT}/passport-admin/banners/${bannerId}/dismiss`,
        {},
        {
          headers: {
            Authorization: `Bearer ${dbAccessToken}`,
          },
        }
      );
    } catch (err) {
      datadogRum.addError(err);
    }
  };

export const useSupportBanners = (): { banners: SupportBannerProps[]; loadBanners: () => Promise<void> } => {
  const { banners, dismiss, update } = useBannerStore();

  const { dbAccessToken, dbAccessTokenStatus } = useDatastoreConnectionContext();

  const query = useQuery({
    enabled: false,
    queryKey: ["banners", dbAccessToken],
    queryFn: () => fetchBanners(dbAccessToken, dismiss),
  });

  useEffect(() => {
    if (query.isSuccess) {
      // side effect on success
      update(query.data || []);
    }
  }, [query.isSuccess, update]);

  const loadBanners = useCallback(async () => {
    if (dbAccessTokenStatus === "connected" && dbAccessToken) {
      query.refetch();
    }
  }, [dbAccessToken, dbAccessTokenStatus]);

  return useMemo(() => ({ banners, loadBanners }), [banners, loadBanners]);
};
