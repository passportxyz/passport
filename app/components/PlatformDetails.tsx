import { PlatformSpec } from "@gitcoin/passport-platforms";

export function PlatformDetails({ currentPlatform }: { currentPlatform: PlatformSpec }) {
  return (
    <div className="w-full text-center sm:py-8">
      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full text-gray-400">
        <img alt="Platform Image" className="h-full w-full" src={currentPlatform?.icon} />
      </div>
      <div className="flex flex-col items-center justify-center text-center">
        <h2 className="font-miriam-libre title-font mt-4 text-2xl font-medium text-gray-900">
          {currentPlatform?.name}
        </h2>
        <p className="font-miriam-libre text-base text-gray-500">{currentPlatform?.description}</p>
      </div>
    </div>
  );
}
