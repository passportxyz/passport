import { PlatformBanner, Hyperlink } from "@gitcoin/passport-platforms";

export function GenericBanner({ banner }: { banner: PlatformBanner }) {
  return (
    <div className="mt-8 text-sm">
      {banner.heading && (
        <div className="mb-2 font-normal inline-block">
          {banner.heading}{" "}
          {banner.cta && (
            <Hyperlink href={banner.cta.url} className="inline-block underline text-color-5 font-bold">
              {banner.cta.label}
            </Hyperlink>
          )}
        </div>
      )}
      <div className="mb-2 inline-block">{banner.content}</div>
    </div>
  );
}
