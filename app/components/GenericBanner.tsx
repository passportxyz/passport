import { PlatformBanner } from "@gitcoin/passport-platforms";

export function GenericBanner({ banner }: { banner: PlatformBanner }) {
  return (
    <div className="mt-2 text-sm">
      {banner.heading && <h2 className="mb-2 font-bold">{banner.heading}</h2>}
      <h2 className="mb-2 ">{banner.content}</h2>
      {banner.cta && (
        <a href={banner.cta.url} className="mt-2 font-alt text-foreground-2" target="_blank" rel="noopener noreferrer">
          {banner.cta.label} →
        </a>
      )}
    </div>
  );
}
