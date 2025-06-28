import React from "react";
import { DrawerHeaderProps } from "../types";

export const DrawerHeader = ({ icon, name, website, onClose }: DrawerHeaderProps) => {
  const headerContent = (
    <>
      <img src={icon} alt={name} className="h-10" />
      <h2 className="text-3xl font-medium text-color-4">{name}</h2>
    </>
  );

  return (
    <div className="flex items-center justify-between">
      {website ? (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          {headerContent}
        </a>
      ) : (
        <div className="flex items-center gap-2">{headerContent}</div>
      )}
      <button
        onClick={onClose}
        className="w-8 h-8 rounded-full text-color-1 flex items-center justify-center"
        aria-label="Close drawer"
      >
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M24 8L8 24M8 8L24 24"
            stroke="#737373"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
};
