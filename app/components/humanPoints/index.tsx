import { FC } from "react";
import { Button } from "../Button";

type IconProps = {
  width?: number;
  height?: number;
  strokeColor?: string;
};

export const Icon: FC<IconProps> = ({ width, height, strokeColor }: IconProps) => {
  if (!strokeColor) {
    strokeColor = "#009973";
  }

  return (
    <svg width={width || 16} height={height || 17} viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="8" cy="8.46463" rx="7" ry="3.11111" stroke={strokeColor} strokeWidth="1.55556" />
      <ellipse
        cx="7.99997"
        cy="8.46484"
        rx="7"
        ry="3.11111"
        transform="rotate(90 7.99997 8.46484)"
        stroke={strokeColor}
        strokeWidth="1.55556"
      />
    </svg>
  );
};

type HumanPointsLabelProps = {
  prefix?: string;
  points: number;
  colorSchemeDark?: Boolean;
  isVisible: boolean;
};

export const HumanPointsLabel: FC<HumanPointsLabelProps> = ({
  prefix,
  points,
  colorSchemeDark,
  isVisible,
}: HumanPointsLabelProps) => {
  const { backgroundColor } = colorSchemeDark
    ? {
        backgroundColor: "bg-emerald-500",
      }
    : {
        backgroundColor: "bg-emerald-100",
      };
  return isVisible ? (
    <div className={`flex items-center ${backgroundColor} rounded-full px-2 py-1 shadow-sm`}>
      <Icon width={18} height={19} />
      <span className="px-1 pt-0.5 text-color-4">
        {prefix}
        {points.toFixed(0)}
      </span>
    </div>
  ) : null;
};

export const HumanPointsLabelSMDark: FC<HumanPointsLabelProps> = ({
  prefix,
  points,
  isVisible,
}: HumanPointsLabelProps) => {
  return isVisible ? (
    <div className={`flex text-sm items-center bg-emerald-500 rounded-full px-1 py-0`}>
      <Icon width={18} height={19} strokeColor="#7BF9C9" />
      <span className="pl-0.5 pr-1 pt-0.5 text-white">
        {prefix}
        {points.toFixed(0)}
      </span>
    </div>
  ) : null;
};

export type HumnSeasonPanelProps = {
  className?: string;
};

export const HumnSeasonPanel: FC<HumnSeasonPanelProps> = ({ className = "" }) => {
  return (
    <div
      className={`relative rounded-3xl overflow-hidden ${className}`}
      style={{ backgroundColor: "rgba(0, 184, 138, 1)" }}
    >
      {/* Gradient overlay with blur */}
      <div
        style={{
          background: "radial-gradient(80% 70% at 10% 15%, rgba(120, 230, 200, 1), transparent 100%)",
          filter: "blur(10px)",
        }}
        className="absolute inset-0 pointer-events-none"
      />
      {/* Content above gradient */}
      <div className="relative z-10 flex flex-col p-4 h-full">
        {/* Top row: Icon on left, Live Now badge on right */}
        <div className="flex justify-between items-start">
          <div className="bg-transparent">
            <Icon width={40} height={40} strokeColor="#FFFFFF" />
          </div>
          <div className="flex items-center bg-white rounded-full px-3 py-1">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="mr-1.5"
            >
              <path
                d="M1.33337 13.3337H1.34004M4.66671 13.3337V10.667M8.00004 13.3337V8.00033M11.3334 13.3337V5.33366M14.6667 2.66699V13.3337"
                stroke="#119725"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-[#119725] font-medium text-sm">Live Now</span>
          </div>
        </div>
        {/* Spacer to push content down */}
        <div className="flex-grow" />
        {/* Title */}
        <p className="text-white text-2xl font-medium">HUMN szn 2</p>
        {/* Join button */}
        <a href="https://manifest.human.tech/" target="_blank" rel="noopener noreferrer" className="mt-4 w-full">
          <Button variant="custom" className="w-full bg-white text-color-4 border-foreground-2">
            <span className="font-semibold">Join now</span>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M1 13L13 1M13 1H1M13 1V13"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Button>
        </a>
      </div>
    </div>
  );
};
