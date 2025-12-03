import React from "react";
import { FeaturedCampaign, isExternalUrl } from "../../config/featuredCampaigns";

interface CampaignCardProps {
  campaign: FeaturedCampaign;
}

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
  const { partnerName, partnerLogo: PartnerLogo, header, subheader, featuredImage, destinationUrl } = campaign;

  const isExternal = isExternalUrl(destinationUrl);

  return (
    <a
      href={destinationUrl}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="block group"
    >
      <div className="relative h-[393px] rounded-[20px] overflow-hidden bg-white hover:scale-[1.01] hover:shadow-lg transition-all duration-200">
        {/* Background image */}
        <img
          src={featuredImage}
          alt={`${partnerName} campaign`}
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        />

        {/* Partner badge - top right */}
        <div className="absolute top-0 left-0 right-0 h-[53px] flex items-center justify-end px-4">
          <div className="bg-white rounded-full px-3 py-1 flex items-center gap-2">
            <PartnerLogo className="w-5 h-5" />
            <span className="text-sm text-gray-900 font-normal">{partnerName}</span>
          </div>
        </div>

        {/* Gradient overlay + text - bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-[210px] bg-gradient-to-t from-black/70 to-transparent flex flex-col items-start justify-end px-5 pb-4 gap-2">
          <p className="text-white font-medium text-base leading-6 w-full">{header}</p>
          <p className="text-white/70 text-sm leading-5 w-full">{subheader}</p>
        </div>
      </div>
    </a>
  );
};
