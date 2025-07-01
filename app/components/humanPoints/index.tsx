import { FC } from "react";

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
};
export const HumanPointsLabel: FC<HumanPointsLabelProps> = ({
  prefix,
  points,
  colorSchemeDark,
}: HumanPointsLabelProps) => {
  const { backgroundColor } = colorSchemeDark
    ? {
        backgroundColor: "bg-emerald-500",
      }
    : {
        backgroundColor: "bg-emerald-100",
      };
  return (
    <div className={`flex items-center ${backgroundColor} rounded-full px-2 py-1`}>
      <Icon width={18} height={19} />
      <span className="px-1 pt-0.5 text-color-4">
        {prefix}
        {points.toFixed(0)}
      </span>
    </div>
  );
};

export const HumanPointsLabelSMDark: FC<HumanPointsLabelProps> = ({ prefix, points }: HumanPointsLabelProps) => {
  return (
    <div className={`flex text-sm items-center bg-emerald-500 rounded-full px-1 py-0`}>
      <Icon width={18} height={19} strokeColor="#7BF9C9" />
      <span className="pl-0.5 pr-1 pt-0.5 text-white">
        {prefix}
        {points.toFixed(0)}
      </span>
    </div>
  );
};
