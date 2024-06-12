import React from "react";

interface ProgressBarProps {
  pointsGained: number;
  pointsAvailable: number;
  isSlim?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ pointsGained, pointsAvailable, isSlim = false }) => {
  const percentGained = (pointsGained / (pointsGained + pointsAvailable)) * 100 || 0;

  const pageWidth = window.innerWidth;

  const padding = 80; // 40 px on either side
  const sliderWidth = 332;
  let fullSliderWidth = 332;

  if (pageWidth < sliderWidth + padding) {
    fullSliderWidth = pageWidth - padding;
  }

  const indicatorWidth = fullSliderWidth * (percentGained / 100);

  const barHeight = isSlim ? 4 : 21;
  const strokeWidth = isSlim ? 1 : 5;
  return (
    <div className={`relative ${isSlim ? "h-1.5" : "h-6"}`}>
      <svg
        className={`absolute ${isSlim ? "top-0.5" : "top-1.5"} z-0`}
        viewBox={`0 ${isSlim ? 9 : 8} 104 ${isSlim ? 2 : 4}`}
      >
        <path
          d={`M102,${isSlim ? 10 : 10} L102,${isSlim ? 10 : 10}`}
          strokeLinecap="round"
          strokeWidth={isSlim ? 1 : 2}
          stroke="rgb(var(--color-foreground-4))"
        />
        <path
          d={`M2,${isSlim ? 10 : 10} L102,${isSlim ? 10 : 10}`}
          strokeLinecap="butt"
          strokeWidth={isSlim ? 1 : 2}
          stroke="rgb(var(--color-foreground-4))"
        />
        <path
          d={`M2,${isSlim ? 10 : 10} L2,${isSlim ? 10 : 10}`}
          strokeLinecap="round"
          strokeWidth={isSlim ? 1 : 2}
          stroke="rgb(var(--color-foreground-4))"
        />
      </svg>
      <svg
        className="absolute"
        id="mySvg"
        width="366"
        height="26"
        viewBox="0 0 366 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="2.5"
          y="2.5"
          width={indicatorWidth}
          height={barHeight}
          rx="10.5"
          fill="#C1F6FF"
          stroke="#0E2825"
          strokeWidth={strokeWidth}
          className="transition-all duration-700 ease-in-out"
        />
      </svg>
    </div>
  );
};
