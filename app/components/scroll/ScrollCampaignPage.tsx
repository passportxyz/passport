import { ProviderWithTitle } from "../ScrollCampaign";
import { BackgroundImage, MobileBackgroundImage, ScrollCampaignPageRoot, ScrollStepsBar } from "./ScrollLayout";

export const ScrollCampaignPage = ({
  children,
  fadeBackgroundImage,
  earnedBadges,
}: {
  children: React.ReactNode;
  fadeBackgroundImage?: boolean;
  earnedBadges?: ProviderWithTitle[];
}) => {
  return (
    <ScrollCampaignPageRoot>
      <div className="grow grid grid-cols-2 items-center justify-center">
        <div className="hidden lg:flex col-start-2 row-start-1 justify-center xl:justify-start xl:ml-16 z-10 ml-2">
          <div className={`flex flex-col items-left w-full gap-y-0 ml-10`}>
            {earnedBadges &&
              earnedBadges.map((badge, index) => (
                <div key={index} className="flex odd:ml-16 items-center even:-my-3">
                  <img
                    src={badge?.image}
                    alt={`Badge Level ${badge.level}`}
                    className="badge-image w-32 h-32 object-contain"
                  />
                  <div className="flex flex-col">
                    <div className="mt-2 text-lg font-semibold">{badge.title}</div>
                    <div className="text-sm">Level: {badge.level}</div>
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="flex col-start-1 col-end-3 row-start-1">
          <div className="flex flex-col min-h-screen justify-center items-center shrink-0 grow w-1/2">
            <div className="mt-24 mb-28 mx-8 lg:mr-1 lg:ml-8 flex flex-col items-start justify-center max-w-[572px] z-10">
              <ScrollStepsBar className="mb-8" />
              {children}
            </div>
            <MobileBackgroundImage />
          </div>
          <BackgroundImage fadeBackgroundImage={fadeBackgroundImage} />
        </div>
      </div>
    </ScrollCampaignPageRoot>
  );
};
