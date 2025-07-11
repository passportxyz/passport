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
    <a href="https://passport.human.tech/blog/points" target="_blank">
      <div className={`flex items-center ${backgroundColor} rounded-full px-2 py-1`}>
        <Icon width={18} height={19} />
        <span className="px-1 pt-0.5 text-color-4">
          {prefix}
          {points.toFixed(0)}
        </span>
      </div>
    </a>
  ) : null;
};

export const HumanPointsLabelSMDark: FC<HumanPointsLabelProps> = ({
  prefix,
  points,
  isVisible,
}: HumanPointsLabelProps) => {
  return isVisible ? (
    <a href="https://passport.human.tech/blog/points" target="_blank">
      <div className={`flex text-sm items-center bg-emerald-500 rounded-full px-1 py-0`}>
        <Icon width={18} height={19} strokeColor="#7BF9C9" />
        <span className="pl-0.5 pr-1 pt-0.5 text-white">
          {prefix}
          {points.toFixed(0)}
        </span>
      </div>
    </a>
  ) : null;
};

export type HumanPointsMultiplierPanelProps = {
  multiplier: number;
  className: string;
  isVisible: boolean;
};
export const HumanPointsMultiplierPanel: FC<HumanPointsMultiplierPanelProps> = ({
  multiplier,
  className = "",
  isVisible,
}) => {
  return isVisible ? (
    <div className={`relative flex flex-col rounded-3xl p-8 ${className}`}>
      <div
        style={{ background: `radial-gradient(ellipse 75% 50% at 20% 25%, oklch(0.905 0.093 164.15), #00B88A)` }}
        className="absolute w-full h-full left-0 top-0 -z-10 rounded-3xl"
      />
      <div className="flex items-center rounded-full bg-emerald-400 w-fit">
        <div className="font-semibold text-[48px] px-6">{multiplier}x</div>
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="72" height="72" rx="36" fill="#009973" />
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M36 9.81836C38.2975 9.81836 40.29 10.8751 41.8814 12.3892C43.4595 13.891 44.7636 15.9417 45.8001 18.2739C46.5883 20.0474 47.2487 22.0523 47.7693 24.2276C49.946 24.7483 51.9517 25.4114 53.7263 26.2001C56.0583 27.2365 58.1092 28.5409 59.611 30.1188C61.1249 31.71 62.1816 33.703 62.1818 36.0002C62.1816 38.2975 61.1251 40.2903 59.611 41.8816C58.1093 43.4595 56.0583 44.7605 53.7263 45.797C51.9518 46.5857 49.9459 47.2482 47.7693 47.7695C47.2486 49.946 46.5887 51.9521 45.8001 53.7265C44.7636 56.0587 43.4595 58.1093 41.8814 59.6112C40.29 61.1252 38.2975 62.182 36 62.182C33.7025 62.1818 31.71 61.1255 30.1186 59.6112C28.5406 58.1094 27.2397 56.0586 26.2032 53.7265C25.4144 51.9517 24.7487 49.9464 24.2274 47.7695C22.052 47.2483 20.0473 46.5853 18.2737 45.797C15.9417 44.7605 13.8907 43.4595 12.389 41.8816C10.8749 40.2903 9.8184 38.2975 9.81818 36.0002C9.8184 33.703 10.8751 31.71 12.389 30.1188C13.8908 28.5409 15.9417 27.2365 18.2737 26.2001C20.0474 25.4118 22.0519 24.7482 24.2274 24.2276C24.7486 22.0519 25.4148 20.0478 26.2032 18.2739C27.2397 15.9418 28.5406 13.891 30.1186 12.3892C31.71 10.8749 33.7025 9.81858 36 9.81836ZM42.0688 48.7558C40.1152 48.9747 38.0821 49.0911 36 49.0911C33.9168 49.0911 31.8825 48.9749 29.9279 48.7558C30.2478 49.78 30.601 50.732 30.9865 51.5995C31.8453 53.5317 32.8004 54.9343 33.7283 55.8174C34.6424 56.6872 35.406 56.9481 36 56.9483C36.5939 56.9483 37.3576 56.687 38.2717 55.8174C39.1996 54.9343 40.1547 53.5317 41.0135 51.5995C41.3989 50.7323 41.7487 49.7796 42.0688 48.7558ZM36 28.143C33.4195 28.143 30.9632 28.3463 28.6951 28.6953C28.3468 30.9633 28.1461 33.4198 28.1461 36.0002C28.1461 38.5793 28.3471 41.0346 28.6951 43.3018C30.9633 43.6501 33.4194 43.8541 36 43.8541C38.5794 43.8541 41.0343 43.6498 43.3016 43.3018C43.6503 41.0345 43.8572 38.5797 43.8572 36.0002C43.8572 33.4194 43.6506 30.9635 43.3016 28.6953C41.0344 28.3467 38.5793 28.143 36 28.143ZM23.2411 29.9281C22.2181 30.248 21.2673 30.6016 20.4007 30.9867C18.4687 31.8454 17.0659 32.8007 16.1828 33.7285C15.3135 34.6422 15.0521 35.4063 15.0519 36.0002C15.0521 36.5941 15.3132 37.358 16.1828 38.2719C17.0658 39.1997 18.4686 40.1549 20.4007 41.0137C21.2673 41.3988 22.2181 41.7526 23.2411 42.0722C23.022 40.1178 22.9091 38.0832 22.9091 36.0002C22.9091 33.9171 23.022 31.8825 23.2411 29.9281ZM48.7556 29.9281C48.9743 31.8827 49.0909 33.917 49.0909 36.0002C49.0909 38.0834 48.9743 40.1177 48.7556 42.0722C49.7797 41.7524 50.7319 41.3991 51.5993 41.0137C53.5314 40.1549 54.9341 39.1997 55.8172 38.2719C56.6868 37.358 56.9479 36.5941 56.9481 36.0002C56.9479 35.4063 56.6865 34.6422 55.8172 33.7285C54.9341 32.8007 53.5312 31.8454 51.5993 30.9867C50.7318 30.6012 49.7797 30.2483 48.7556 29.9281ZM36 15.0521C35.406 15.0523 34.6424 15.3131 33.7283 16.183C32.8004 17.0661 31.8453 18.4687 30.9865 20.4009C30.6014 21.2675 30.2476 22.2182 29.9279 23.2413C31.8824 23.0226 33.917 22.9093 36 22.9093C38.0819 22.9093 40.1153 23.0228 42.0688 23.2413C41.7489 22.2187 41.3985 21.2672 41.0135 20.4009C40.1547 18.4687 39.1996 17.0661 38.2717 16.183C37.3576 15.3134 36.5939 15.0521 36 15.0521Z"
            fill="white"
          />
        </svg>
      </div>
      <p className="pl-0.5 pr-1 pt-0.5 text-white text-2xl font-medium pt-4">Double HUMN Points!</p>
      <p className="pl-0.5 pr-1 pt-0.5 text-white text-xl font-normal">
        Thank you for being an early bird! Here’s your doubled points as a reward!
      </p>
    </div>
  ) : null;
};
