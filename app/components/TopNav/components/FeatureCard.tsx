import React from "react";
import { getIcon } from "./Icons";
import type { NavFeature } from "../mocks/navData";

export const FeatureCard: React.FC<NavFeature> = ({ icon, title, description, url }) => {
  const IconComponent = getIcon(icon);

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`
        flex flex-col gap-2 p-4 rounded-lg text-left w-full h-full
        bg-background hover:brightness-90
        hover:shadow-md
        focus:outline-none focus:ring-2 focus:ring-focus focus:ring-opacity-50
        no-underline
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
      {description && <p className="text-color-9 text-sm leading-5 pl-9">{description}</p>}
    </a>
  );
};
