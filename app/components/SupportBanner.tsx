import axios from "axios";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../context/userContext";
import { datadogRum } from "@datadog/browser-rum";
import Warning from "./Warning";

type SupportBannerProps = {
  name: string;
  content: string;
  link: string;
  banner_id: number;
};

export function SupportBanner() {
  const [banners, setBanners] = useState<SupportBannerProps[]>([]);
  const { dbAccessToken, dbAccessTokenStatus } = useContext(UserContext);
  useEffect(() => {
    (async function checkForBanners() {
      if (dbAccessTokenStatus === "connected" && dbAccessToken) {
        const banners: {
          data: SupportBannerProps[];
        } = await axios.get(`${process.env.NEXT_PUBLIC_SCORER_ENDPOINT}/passport-admin/banners`, {
          headers: {
            Authorization: `Bearer ${dbAccessToken}`,
          },
        });
        setBanners(banners.data);
      }
    })();
  }, [dbAccessToken, dbAccessTokenStatus]);

  const dismissSupportBanner = async (banner_id: number) => {
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
      setBanners(banners.filter((banner) => banner.banner_id !== banner_id));
    } catch (err) {
      datadogRum.addError(err);
    }
  };

  return (
    <>
      {banners.map((banner) => (
        <Warning
          key={banner.banner_id}
          userWarning={{ name: banner.name, content: banner.content, link: banner.link, dismissible: true }}
          onDismiss={() => dismissSupportBanner(banner.banner_id, dbAccessToken)}
          className="border-t border-accent-2 px-0"
        />
      ))}
    </>
  );
}
