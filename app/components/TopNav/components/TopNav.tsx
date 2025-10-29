import React from "react";
import { FeatureCard } from "./FeatureCard";
import { getIcon, getPartnerLogo } from "./Icons";
import type { NavFeature, PartnerLink } from "../mocks/navData";

interface TopNavProps {
  features?: NavFeature[];
  partners?: PartnerLink[];
  onFeatureClick?: (id: string) => void;
  onPartnerClick?: (id: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ features = [], partners = [], onFeatureClick, onPartnerClick }) => {
  const WandIcon = getIcon("wand");

  const handlePartnerClick = (id: string) => {
    if (onPartnerClick) {
      onPartnerClick(id);
    } else {
      window.location.hash = `#/${id}/dashboard`;
    }
  };

  return (
    <div
      className={`
        backdrop-blur-[25px] backdrop-filter bg-foreground box-border
        flex flex-col gap-3 items-center p-4
        rounded-xl shadow-[0px_1px_1px_0px_rgba(0,0,0,0.16),0px_10px_22px_0px_rgba(0,0,0,0.25)]
        w-full
      `}
    >
      {/* Feature Cards Section */}
      <div className="flex gap-3 items-start justify-center w-full">
        {features.map((feature) => (
          <div key={feature.id} className="flex-1 min-w-0">
            <FeatureCard {...feature} onClick={onFeatureClick} />
          </div>
        ))}
      </div>

      {/* Partner Custom Dashboards Section */}
      {partners.length > 0 && (
        <div className="bg-background box-border flex flex-col gap-4 items-start p-4 rounded-lg w-full">
          <div className="flex gap-3 items-center">
            {WandIcon && (
              <div className="w-6 h-6 text-color-4 flex-shrink-0">
                <WandIcon className="w-full h-full" />
              </div>
            )}
            <h3 className="font-medium text-base leading-6 text-color-4">Partner Custom Dashboards</h3>
          </div>

          <div className="flex items-stretch gap-2 w-full">
            {partners.map((partner) => {
              const LogoComponent = getPartnerLogo(partner.logo);
              return (
                <button
                  key={partner.id}
                  onClick={() => handlePartnerClick(partner.id)}
                  className={
                    partner.isCurrent
                      ? "flex-1 bg-foreground brightness-[.83] shadow-md cursor-default box-border flex gap-2 items-center justify-center p-2 rounded-lg transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-focus focus:ring-opacity-50"
                      : "flex-1 bg-foreground box-border flex gap-2 items-center justify-center p-2 rounded-lg transition-all duration-200 ease-in-out hover:brightness-[.83] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-focus focus:ring-opacity-50"
                  }
                >
                  {LogoComponent && (
                    <div className="w-[23px] h-[23px] flex-shrink-0">
                      <LogoComponent className="w-full h-full" />
                    </div>
                  )}
                  <span className="font-medium text-sm leading-5 text-color-4 whitespace-nowrap">{partner.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
