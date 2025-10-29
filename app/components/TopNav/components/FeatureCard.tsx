import React from "react";
import { getIcon } from "./Icons";
import type { NavFeature } from "../mocks/navData";

interface FeatureCardProps extends NavFeature {
  onClick?: (id: string) => void;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, id, onClick }) => {
  const IconComponent = getIcon(icon);

  const handleClick = () => {
    if (onClick) {
      onClick(id);
    } else {
      // Default navigation behavior
      window.location.hash = `#/${id}/dashboard`;
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex flex-col gap-2 p-4 rounded-lg text-left w-full
        transition-all duration-200 ease-in-out
        bg-background hover:brightness-90
        hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-focus focus:ring-opacity-50
      `}
    >
      <div className="flex items-center gap-3">
        {IconComponent && (
          <div className="w-6 h-6 text-color-4 flex-shrink-0">
            <IconComponent className="w-full h-full" />
          </div>
        )}
        <h3 className="text-color-4 font-medium text-base leading-6">{title}</h3>
      </div>
      <p className="text-color-9 text-sm leading-5 pl-9">{description}</p>
    </button>
  );
};
