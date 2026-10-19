import React, { useState } from "react";
import { FeaturedCampaign, SanitizedHTMLComponent } from "../../utils/customizationUtils";

interface CampaignCardProps {
  campaign: FeaturedCampaign;
}

// Helper to determine if URL is external
const isExternalUrl = (url: string): boolean => {
  return url.startsWith("http://") || url.startsWith("https://");
};

export const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
  const { partnerName, partnerLogo, header, subheader, imageTag, destinationUrl, audienceLabel, details } = campaign;
  const [imgError, setImgError] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const isExternal = isExternalUrl(destinationUrl);

  // Build image path from imageTag, falling back to placeholder on error
  const imagePath = imgError ? "/assets/campaigns/placeholder.webp" : `/assets/campaigns/${imageTag}.webp`;

  return (
    <div className="relative h-[393px] rounded-[20px] overflow-hidden bg-white hover:scale-[1.01] hover:shadow-lg transition-all duration-200">
      {/* Card-wide link. It is a sibling of the "Learn more" button, not its parent,
          so the button can open the details without following the link. */}
      <a
        href={destinationUrl}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
        aria-label={`${partnerName}: ${header}`}
        className="absolute inset-0 z-[1] rounded-[20px] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white"
      />

      {/* Background image */}
      <img
        src={imagePath}
        alt={`${partnerName} campaign`}
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
        onError={() => setImgError(true)}
      />

      {/* Partner badge - top right, audience label - top left */}
      <div className="absolute top-0 left-0 right-0 h-[53px] flex items-center justify-between gap-2 px-4 pointer-events-none">
        {audienceLabel && !detailsOpen ? (
          <span className="bg-gray-900/70 text-white text-xs leading-4 tracking-wide rounded-full px-[10px] py-[5px]">
            {audienceLabel}
          </span>
        ) : (
          <span />
        )}
        <div className="bg-white rounded-full px-3 py-1 flex items-center gap-2">
          <div className="w-5 h-5 flex items-center justify-center">
            <SanitizedHTMLComponent html={partnerLogo} />
          </div>
          <span className="text-sm text-gray-900 font-normal">{partnerName}</span>
        </div>
      </div>

      {/* Details panel, shown by "Learn more" */}
      {details && detailsOpen && (
        <div
          id={`campaign-details-${imageTag}`}
          className="absolute inset-0 z-[2] bg-[rgba(10,20,18,0.88)] backdrop-blur-sm text-white px-5 pt-6 pb-14 flex flex-col gap-[10px] overflow-y-auto"
        >
          <p className="text-xs tracking-widest uppercase text-white/70">How Passport is used</p>
          <p className="text-[15px] leading-[22px]">{details}</p>
        </div>
      )}

      {/* Gradient overlay + text - bottom */}
      <div
        className={`absolute bottom-0 left-0 right-0 h-[210px] flex flex-col items-start justify-end px-5 pb-4 gap-2 pointer-events-none ${
          detailsOpen ? "z-[3]" : "bg-gradient-to-t from-black/70 to-transparent"
        }`}
      >
        {!detailsOpen && (
          <>
            <p className="text-white font-medium text-base leading-6 w-full">{header}</p>
            <p className="text-white/70 text-sm leading-5 w-full">{subheader}</p>
          </>
        )}
        {details && (
          <button
            type="button"
            onClick={() => setDetailsOpen((open) => !open)}
            aria-expanded={detailsOpen}
            aria-controls={`campaign-details-${imageTag}`}
            className="relative z-[3] pointer-events-auto text-white text-sm leading-5 font-medium underline underline-offset-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-white rounded-sm"
          >
            {detailsOpen ? "Show less" : "Learn more"}
          </button>
        )}
      </div>
    </div>
  );
};
