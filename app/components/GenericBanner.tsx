import { PlatformBanner } from "@gitcoin/passport-platforms/dist/commonjs/utils/platform";

export function GenericBanner({ banner }: { banner: PlatformBanner }) {
  return (
    <div className="p-4">
      <div className="mt-10 rounded-lg border border-purple-infoElementBorder bg-purple-infoElementBG px-4 py-6">
        <div className="font-libre-franklin">
          <h2 className="text-md mb-0 text-left font-bold text-gray-900">{banner.heading}</h2>
          <h2 className="text-md mb-2 text-left text-gray-900">{banner.content}</h2>
          <hr />
          {banner.cta && (
            <a
              href={banner.cta.url}
              className="mx-auto mt-2 flex justify-center text-purple-gitcoinpurple"
              target="_blank"
              rel="noopener noreferrer"
            >
              {banner.cta.label}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
