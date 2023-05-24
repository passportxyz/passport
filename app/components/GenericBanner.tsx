import { PlatformBanner } from "@gitcoin/passport-platforms/dist/commonjs/utils/platform";

export function GenericBanner({ banner }: { banner: PlatformBanner }) {
  return (
    <div className="p-4">
      <div className="border-accent2 mt-10 rounded-lg border px-4 py-6 text-color-4">
        <h2 className="text-md mb-0 text-left font-bold">{banner.heading}</h2>
        <h2 className="text-md mb-2 text-left">{banner.content}</h2>
        {banner.cta && (
          <>
            <hr className="border-background" />
            <a
              href={banner.cta.url}
              className="mx-auto mt-2 flex justify-center font-semibold text-accent-3"
              target="_blank"
              rel="noopener noreferrer"
            >
              {banner.cta.label}
            </a>
          </>
        )}
      </div>
    </div>
  );
}
