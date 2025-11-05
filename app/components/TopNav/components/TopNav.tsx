import React from "react";
import { FeatureCard } from "./FeatureCard";
import { getIcon } from "./Icons";
import { SanitizedHTMLComponent } from "../../../utils/customizationUtils";
import type { NavFeature, PartnerLink } from "../mocks/navData";

interface TopNavProps {
  features?: NavFeature[];
  partners?: PartnerLink[];
  onPartnerClick?: (id: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ features = [], partners = [], onPartnerClick }) => {
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
        bg-foreground box-border
        flex flex-col gap-3 items-center p-4
        rounded-xl shadow-[0px_1px_1px_0px_rgba(0,0,0,0.16),0px_10px_22px_0px_rgba(0,0,0,0.25)]
        w-full
      `}
    >
      {/* Feature Cards Section */}
      <div className="grid grid-cols-2 gap-3 w-full">
        {features.map((feature, index) => (
          <div key={index} className="flex">
            <FeatureCard {...feature} />
          </div>
        ))}
      </div>

      {/* Partner Custom Dashboards Section */}
      {partners.length > 0 ? (
        <div className="bg-background box-border flex gap-4 items-start p-4 rounded-lg w-full">
          {/* Left side: Icon, heading, and description */}
          <div className="flex flex-col gap-2 flex-shrink-0" style={{ width: "280px" }}>
            <div className="flex gap-3 items-center">
              {WandIcon && (
                <div className="w-6 h-6 text-color-4 flex-shrink-0">
                  <WandIcon className="w-full h-full" />
                </div>
              )}
              <h3 className="font-medium text-base leading-6 text-color-4">Partner Custom Dashboards</h3>
            </div>
            <p className="text-sm text-color-9 leading-5">
              A comprehensive framework for managing and utilizing passports.
            </p>
          </div>

          {/* Right side: 2x3 grid of partner dashboards */}
          <div className="grid grid-cols-2 gap-2 flex-1">
            {partners.map((partner) => (
              <button
                key={partner.id}
                onClick={() => handlePartnerClick(partner.id)}
                className={
                  partner.isCurrent
                    ? "bg-foreground brightness-[.83] shadow-md cursor-default box-border flex gap-2 items-center justify-center p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-focus focus:ring-opacity-50"
                    : "bg-foreground box-border flex gap-2 items-center justify-center p-2 rounded-lg hover:brightness-[.83] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-focus focus:ring-opacity-50"
                }
              >
                <div className="w-[23px] h-[23px] flex-shrink-0">
                  <SanitizedHTMLComponent html={partner.logo} />
                </div>
                <span className="font-medium text-sm leading-5 text-color-4 whitespace-nowrap">{partner.name}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
