import React from "react";

interface ProgressBarProps {
  pointsGained: number;
  pointsAvailable: number;
  isSlim?: boolean;
  gainedBarColor?: string;
  availableBarColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  pointsGained,
  pointsAvailable,
  isSlim = false,
  gainedBarColor = "#009973",
  availableBarColor = "white",
}) => {
  const percentGained = (pointsGained / (pointsGained + pointsAvailable)) * 100 || 0;

  const gainedBarWidth = isSlim ? 3 : 6;
  const remainingBarWidth = isSlim ? 3 : 3;
  const capDistance = isSlim ? 2 : 4; // The additional space required at the progress bar end, to allow for nice rounding
  const gainedBarBorder = isSlim ? 3 : 3;

  const heightClass = `h-[${gainedBarWidth + 2 * gainedBarBorder}px]`;

  return (
    <div className={heightClass}>
      <svg viewBox={`0 0 ${100 + 2 * capDistance} 10`} preserveAspectRatio="none">
        {/* We draw the thinner bar, that indicates the remaining part */}
        <line
          x1={capDistance}
          y1="5"
          x2={100 + capDistance}
          y2="5"
          stroke={availableBarColor}
          strokeWidth={remainingBarWidth}
          strokeLinecap="round"
        />
        {/* We draw the "border" as wider bar than the "gained" bar. */}
        {/* <line
          x1={capDistance}
          y1="5"
          x2={percentGained + capDistance}
          y2="5"
          stroke="#0E2825"
          strokeWidth={gainedBarWidth + gainedBarBorder}
          strokeLinecap="round"
        /> */}
        {/* We draw the "gained" part of the bar, on top of the "border". What remains visible of the border bar will look like a nice border */}
        <line
          x1={capDistance}
          y1="5"
          x2={percentGained + capDistance}
          y2="5"
          stroke={gainedBarColor}
          strokeWidth={gainedBarWidth}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
};
