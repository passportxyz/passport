import Warning from "./Warning";
import { SupportBannerProps } from "../hooks/useSupportBanners";

export function SupportBanner({ banners }: { banners: SupportBannerProps[] }): JSX.Element {
  return (
    <>
      {banners.map((banner) => (
        <Warning
          key={banner.banner_id}
          userWarning={{ content: banner.content, link: banner.link, dismissible: true }}
          onDismiss={banner.dismiss}
          className="max-w-full border-t border-background px-4"
        />
      ))}
    </>
  );
}
