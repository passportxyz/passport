import { FC } from "react";

type IconProps = {
  width?: number;
  height?: number;
};
export const Icon: FC<IconProps> = ({ width, height }: IconProps) => {
  return (
    <svg width={width || 16} height={height || 17} viewBox="0 0 16 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="8" cy="8.46463" rx="7" ry="3.11111" stroke="#009973" strokeWidth="1.55556" />
      <ellipse
        cx="7.99997"
        cy="8.46484"
        rx="7"
        ry="3.11111"
        transform="rotate(90 7.99997 8.46484)"
        stroke="#009973"
        strokeWidth="1.55556"
      />
    </svg>
  );
};

type HumanPointsLabelProps = {
  prefix?: string;
  points: number;
};
export const HumanPointsLabel: FC<HumanPointsLabelProps> = ({ prefix, points }: HumanPointsLabelProps) => {
  return (
    <div className="flex items-center bg-emerald-100 rounded-full px-2 py-1">
      <Icon width={18} height={19} />
      <span className="px-1 pt-0.5 text-color-4">
        {prefix}
        {points.toFixed(0)}
      </span>
    </div>
  );
};
