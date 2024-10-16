import { ProviderWithTitle } from "../ScrollCampaign";
import { MobileBackgroundImage, ScrollCampaignPageRoot, ScrollFooter } from "./ScrollLayout";
import { RenderedBadges } from "./ScrollMintedBadge";

export const ScrollMintingBadge = ({ earnedBadges }: { earnedBadges: ProviderWithTitle[] }) => {
  return (
    <ScrollCampaignPageRoot>
      <div className="flex grow mx-8 md:mx-10 py-10 md:py-0">
        <div className="flex flex-col min-h-screen mt-16 lg:mt-0 justify-start lg:justify-center items-center shrink-0 grow w-1/2 text-center">
          <div className="text-3xl lg:text-5xl text-[#FFEEDA] mb-10">
            Minting badge{earnedBadges.length > 1 ? "s" : ""}...
          </div>
          <div className="flex flex-wrap justify-center items-end gap-8">
            <RenderedBadges badges={earnedBadges} />
          </div>
        </div>
      </div>
      <ScrollFooter className="absolute bottom-0 left-0 right-0 z-10" />
      <MobileBackgroundImage />
    </ScrollCampaignPageRoot>
  );
};
