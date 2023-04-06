import { PlatformSpec } from "@gitcoin/passport-platforms";

export function PlatformDetails({ currentPlatform }: { currentPlatform: PlatformSpec }) {
  return (
    <div className="sm:py-8 w-full text-center">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full text-gray-400">
        <img alt="Platform Image" className="h-full w-full" src={currentPlatform?.icon} />
      </div>
      <div className="flex flex-col items-center justify-center text-center">
        <h2 className="mt-4 text-2xl">{currentPlatform?.name}</h2>
        <p className="text-base text-color-4">{currentPlatform?.description}</p>
      </div>
    </div>
  );
}
