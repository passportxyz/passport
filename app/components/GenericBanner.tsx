import { PlatformBanner } from "@gitcoin/passport-platforms/dist/commonjs/utils/platform";

export function GenericBanner({ banner }: { banner: PlatformBanner }) {
  return (
    <div className="p-4">
      <div className="mt-10 rounded-lg border border-accent bg-muted px-4 py-6 text-background">
        <div className="font-libre-franklin">
          <h2 className="text-md mb-0 text-left font-bold">{banner.heading}</h2>
          <h2 className="text-md mb-2 text-left">{banner.content}</h2>
          {banner.cta && (
            <>
              <hr className="border-background" />
              <a
                href={banner.cta.url}
                className="mx-auto mt-2 flex justify-center font-semibold text-accent"
                target="_blank"
                rel="noopener noreferrer"
              >
                {banner.cta.label}
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
