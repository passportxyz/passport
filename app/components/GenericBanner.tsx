import { PlatformBanner } from "@gitcoin/passport-platforms";

export function GenericBanner({ banner }: { banner: PlatformBanner }) {
  return (
    <div className="mt-8 text-sm">
      {banner.heading && (
        <p className="mb-2 font-normal inline-block">
          {banner.heading}{" "}
          {banner.cta && (
            <a
              href={banner.cta.url}
              className="inline-block underline text-color-5 font-bold"
              target="_blank"
              rel="noopener noreferrer"
            >
              {banner.cta.label}
            </a>
          )}
        </p>
      )}
      <p className="mb-2 inline-block">{banner.content}</p>
    </div>
  );
}
