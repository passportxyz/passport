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
    // TODO: Update href to actual HUMN szn 2 destination
    <a href="https://google.com" target="_blank" rel="noopener noreferrer">
      <div className={`flex items-center ${backgroundColor} rounded-full px-2 py-1 shadow-sm hover:shadow-md`}>
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
    // TODO: Update href to actual HUMN szn 2 destination
    <a href="https://google.com" target="_blank" rel="noopener noreferrer">
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

// HUMN Logo (white version)
const HumnLogo: FC = () => (
  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M20 0C22.5528 0 24.7667 1.17408 26.5348 2.85648C28.2883 4.52472 29.7374 6.80236 30.8889 9.39322C31.7648 11.3638 32.4986 13.5913 33.077 16.0082C35.4955 16.5869 37.7244 17.3236 39.6967 18.2014C42.2877 19.3529 44.5648 20.8021 46.2325 22.5551C47.9151 24.3232 49.0893 26.5375 49.0893 29.0903C49.0893 31.6432 47.9153 33.8578 46.2325 35.6259C44.5649 37.3786 42.2877 38.8281 39.6967 39.9796C37.7241 40.857 35.4952 41.5934 33.077 42.1721C32.4985 44.5893 31.7652 46.8171 30.8889 48.7878C29.7374 51.3787 28.2883 53.6562 26.5348 55.3245C24.7667 57.0069 22.5528 58.1812 20 58.1812C17.4472 58.181 15.2333 57.0072 13.4652 55.3245C11.7118 53.6563 10.2659 51.3786 9.11441 48.7878C8.23808 46.8166 7.50115 44.5889 6.92263 42.1721C4.50523 41.5935 2.27693 40.8567 0.305328 39.9796C-2.28576 38.828 -4.56287 37.3786 -6.23046 35.6259C-7.91328 33.8578 -9.08926 31.6432 -9.08926 29.0903C-9.08926 26.5375 -7.91307 24.3232 -6.23046 22.5551C-4.56308 20.8021 -2.28576 19.3529 0.305328 18.2014C2.27735 17.324 4.50544 16.5868 6.92263 16.0082C7.50094 13.5909 8.23849 11.3642 9.11441 9.39322C10.2659 6.80236 11.7118 4.52472 13.4652 2.85648C15.2333 1.17387 17.4472 0.000212288 20 0ZM26.7431 43.2843C24.5724 43.5275 22.3147 43.6568 20 43.6568C17.6841 43.6568 15.4251 43.5276 13.2532 43.2843C13.6086 44.4218 14.0011 45.479 14.4294 46.4428C15.3838 48.5893 16.4452 50.1477 17.4762 50.9286C18.4924 51.6973 19.3407 51.8884 20 51.8886C20.6593 51.8886 21.5076 51.6971 22.5238 50.9286C23.5548 50.1477 24.6162 48.5893 25.5706 46.4428C25.9988 45.4793 26.3877 44.4214 26.7431 43.2843ZM20 20.3595C17.1327 20.3595 14.4036 20.5851 11.883 20.9727C11.4961 23.4933 11.2736 26.2226 11.2736 29.0903C11.2736 31.9566 11.4964 34.6848 11.883 37.2045C14.4037 37.5915 17.1326 37.8175 20 37.8175C22.8661 37.8175 25.594 37.5912 28.1137 37.2045C28.5011 34.6847 28.7299 31.957 28.7299 29.0903C28.7299 26.2223 28.5014 23.4935 28.1137 20.9727C25.5941 20.5855 22.866 20.3595 20 20.3595ZM5.85121 22.3423C4.7144 22.6977 3.65775 23.0903 2.69452 23.518C0.548105 24.4724 -1.01016 25.5339 -1.79086 26.5649C-2.55997 27.5808 -2.75089 28.4294 -2.75089 29.0903C-2.75089 29.7512 -2.55976 30.5998 -1.79086 31.6157C-1.01016 32.6466 0.548273 33.7082 2.69452 34.6626C3.65775 35.0903 4.7144 35.4829 5.85121 35.8383C5.60776 33.6666 5.48211 31.4079 5.48211 29.0903C5.48211 26.7727 5.60776 24.514 5.85121 22.3423ZM34.1455 22.3423C34.389 24.5142 34.5214 26.7727 34.5214 29.0903C34.5214 31.4079 34.389 33.6663 34.1455 35.8383C35.2836 35.4827 36.3407 35.0906 37.3055 34.6626C39.4519 33.7082 41.0101 32.6466 41.7909 31.6157C42.56 30.5998 42.7509 29.7512 42.7509 29.0903C42.7509 28.4294 42.5598 27.5808 41.7909 26.5649C41.0101 25.5339 39.4517 24.4724 37.3055 23.518C36.3405 23.0899 35.2836 22.6981 34.1455 22.3423ZM20 6.29198C19.3407 6.29219 18.4924 6.48353 17.4762 7.25201C16.4452 8.0329 15.3838 9.59134 14.4294 11.7378C14.0016 12.7013 13.6084 13.7584 13.2532 14.8963C15.425 15.1398 17.6842 15.2655 20 15.2655C22.3145 15.2655 24.5725 15.14 26.7431 14.8963C26.3879 13.7589 25.9984 12.701 25.5706 11.7378C24.6162 9.59134 23.5548 8.0329 22.5238 7.25201C21.5076 6.48332 20.6593 6.29198 20 6.29198Z"
      transform="translate(0, 0)"
      fill="white"
    />
  </svg>
);

// Signal/Live icon for the chip
const SignalIcon: FC = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M3.33333 11.3333C2.44928 10.4493 1.875 9.30053 1.69333 8.06C1.51167 6.81947 1.73217 5.55447 2.32133 4.46C2.91049 3.36553 3.83573 2.5014 4.96667 2C M12.6667 11.3333C13.5507 10.4493 14.125 9.30053 14.3067 8.06C14.4883 6.81947 14.2678 5.55447 13.6787 4.46C13.0895 3.36553 12.1643 2.5014 11.0333 2 M5.66667 9C5.20101 8.53433 4.9375 7.90313 4.9375 7.24333C4.9375 6.58353 5.20101 5.95233 5.66667 5.48667 M10.3333 9C10.799 8.53433 11.0625 7.90313 11.0625 7.24333C11.0625 6.58353 10.799 5.95233 10.3333 5.48667 M8 8V8.00667"
      stroke="#119725"
      strokeWidth="1.5"
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
  isVisible: boolean;
};

export const HumnSeasonPanel: FC<HumnSeasonPanelProps> = ({ className = "", isVisible }) => {
  if (!isVisible) return null;

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
          <HumnLogo />
          <div className="flex items-center gap-1 bg-white rounded-full pl-1 pr-2 py-0.5">
            <SignalIcon />
            <span className="text-sm text-[#119725]">Live Now</span>
          </div>
        </div>

        {/* Title */}
        <div className="flex flex-col grow justify-center">
          <h2 className="text-2xl font-medium text-white">HUMN szn 2</h2>
        </div>

        {/* Button */}
        {/* TODO: Update href to actual HUMN szn 2 destination */}
        <a
          href="https://google.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-white rounded-lg px-5 py-2.5 w-full hover:brightness-95 transition-all"
        >
          <span className="text-base font-medium text-[#0A0A0A]">Join now</span>
          <ArrowUpRightIcon />
        </a>
      </div>
    </div>
  );
};

// Keep the old component for backwards compatibility but mark as deprecated
/** @deprecated Use HumnSeasonPanel instead */
export type HumanPointsMultiplierPanelProps = {
  multiplier: number;
  className: string;
  isVisible: boolean;
};
/** @deprecated Use HumnSeasonPanel instead */
export const HumanPointsMultiplierPanel: FC<HumanPointsMultiplierPanelProps> = ({ className = "", isVisible }) => {
  return <HumnSeasonPanel className={className} isVisible={isVisible} />;
};
