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

// Signal/Live icon for the chip
const SignalIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M1.33337 13.3337H1.34004M4.66671 13.3337V10.667M8.00004 13.3337V8.00033M11.3334 13.3337V5.33366M14.6667 2.66699V13.3337"
      stroke="#119725"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Arrow up-right icon for the button
const ArrowUpRightIcon: FC = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7 17L17 7M17 7H7M17 7V17" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export type HumnSeasonPanelProps = {
  className?: string;
};

export const HumnSeasonPanel: FC<HumnSeasonPanelProps> = ({ className = "" }) => {
  return (
    <div
      className={`relative flex flex-col rounded-3xl p-5 overflow-hidden ${className}`}
      style={{ background: "#00B88A" }}
    >
      {/* Background blur/glow effect */}
      <div
        className="absolute -left-20 -top-20 w-72 h-64 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, #18ECA9 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col gap-4 grow">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <Icon width={40} height={40} strokeColor="#FFFFFF" />
          <div className="flex items-center gap-1 bg-white rounded-full pl-1 pr-2 py-0.5">
            <SignalIcon />
            <span className="text-sm text-[#119725]">Live Now</span>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col grow justify-center">
          <h2 className="text-2xl font-medium text-white">HUMN Season 2</h2>
        </div>

        {/* Button */}
        <a
          href="https://manifest.human.tech/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-white rounded-lg px-5 py-2.5 w-full hover:brightness-95 transition-all"
        >
          <span className="text-base font-semibold text-[#0A0A0A]">Join now</span>
          <ArrowUpRightIcon />
        </a>
      </div>
    </div>
  );
};
