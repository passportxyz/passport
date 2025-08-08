import axios from "axios";
import { useCallback, useMemo, useEffect } from "react";
import { datadogRum } from "@datadog/browser-rum";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useQuery } from "@tanstack/react-query";
import { create } from "zustand";
import { useCustomization } from "./useCustomization";

export type SupportBannerProps = {
  content: string;
  link: string | undefined;
  banner_id: number;
  application: string;
  display_on_all_dashboards: boolean;
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
      link: banner.link || undefined,
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
  const customization = useCustomization();

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

  // Filter banners based on display_on_all_dashboards and current customization
  const filteredBanners = useMemo(() => {
    // For non-custom dashboards (key === "none"), show all banners
    if (customization.key === "none") {
      return banners;
    }

    // For custom dashboards, only show banners that are set to display on all dashboards
    return banners.filter((banner) => banner.display_on_all_dashboards);
  }, [banners, customization.key]);

  return useMemo(() => ({ banners: filteredBanners, loadBanners }), [filteredBanners, loadBanners]);
};
