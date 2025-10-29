// SVG Icons for TopNav features and partner logos
import React from "react";

interface IconProps {
  className?: string;
}

export const UserCheckIcon: React.FC<IconProps> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M17 11L19 13L23 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Fixed Embed Icon - not actually the same as user-check in the actual design
export const EmbedIcon: React.FC<IconProps> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.5 11C10.7091 11 12.5 9.20914 12.5 7C12.5 4.79086 10.7091 3 8.5 3C6.29086 3 4.5 4.79086 4.5 7C4.5 9.20914 6.29086 11 8.5 11Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M17 11L19 13L23 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const DatabaseIcon: React.FC<IconProps> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <ellipse
      cx="12"
      cy="5"
      rx="9"
      ry="3"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M21 12C21 13.66 16.97 15 12 15C7.03 15 3 13.66 3 12"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M3 5V19C3 20.66 7.03 22 12 22C16.97 22 21 20.66 21 19V5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M14 12L16 14L11 19L8 16"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PassportIcon: React.FC<IconProps> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect
      x="4"
      y="2"
      width="16"
      height="20"
      rx="2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 18H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WandIcon: React.FC<IconProps> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M15 4V2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M15 16V14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M8 9H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M20 9H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.5 4.5L9 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.5 13.5L21 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M19.5 4.5L21 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M10.5 13.5L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path
      d="M10 21L14 9L6 13L10 21Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Partner Logos
export const LidoLogo: React.FC<IconProps> = ({ className }) => (
  <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M11.5 1L14.7353 7.59317L22 8.65392L16.75 13.7581L18.0451 21L11.5 17.5593L4.95493 21L6.25 13.7581L1 8.65392L8.26474 7.59317L11.5 1Z"
      fill="#00A3FF"
    />
  </svg>
);

export const VeraxLogo: React.FC<IconProps> = ({ className }) => (
  <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M11.5 3.5L7.5 10.5H15.5L11.5 19.5"
      stroke="#F59E0B"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ShapeLogo: React.FC<IconProps> = ({ className }) => (
  <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="11.5" cy="11.5" r="9" fill="black" />
  </svg>
);

export const OctantLogo: React.FC<IconProps> = ({ className }) => (
  <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="1" y="1" width="21" height="21" rx="4" fill="#000000" />
    <circle cx="11.5" cy="11.5" r="6" fill="#FFFFFF" />
    <circle cx="11.5" cy="11.5" r="3" fill="#000000" />
  </svg>
);

export const RecallLogo: React.FC<IconProps> = ({ className }) => (
  <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11.5 2V12L18.5 19" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
    <path d="M4.5 7L11.5 12" stroke="#4B5563" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const LineaLogo: React.FC<IconProps> = ({ className }) => (
  <svg width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <rect x="1" y="1" width="21" height="21" rx="3" fill="white" />
    <rect x="3" y="3" width="5" height="5" fill="#000000" />
    <path d="M5 11H18V19H5V11Z" fill="#000000" />
  </svg>
);

// Get icon component by name
export const getIcon = (iconName: string): React.FC<IconProps> | null => {
  switch (iconName) {
    case "user-check":
      return UserCheckIcon;
    case "embed":
      return EmbedIcon;
    case "database":
      return DatabaseIcon;
    case "passport":
      return PassportIcon;
    case "wand":
      return WandIcon;
    default:
      return null;
  }
};

// Get partner logo component by name
export const getPartnerLogo = (logoName: string): React.FC<IconProps> | null => {
  switch (logoName) {
    case "lido":
      return LidoLogo;
    case "verax":
      return VeraxLogo;
    case "shape":
      return ShapeLogo;
    case "octant":
      return OctantLogo;
    case "recall":
      return RecallLogo;
    case "linea":
      return LineaLogo;
    default:
      return null;
  }
};
