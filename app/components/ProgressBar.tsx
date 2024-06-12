import React from "react";

interface ProgressBarProps {
  pointsGained: number;
  pointsAvailable: number;
  isSlim?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ pointsGained, pointsAvailable, isSlim = false }) => {
  const percentGained = (pointsGained / (pointsGained + pointsAvailable)) * 100 || 0;

  const gainedBarWidth = isSlim ? 3 : 6;
  const remainingBarWidth = isSlim ? 1 : 3;
  const capDistance = isSlim ? 2 : 4;
  const gainedBarBorder = isSlim ? 1 : 3;
  
  const heightClass = `h-[${gainedBarWidth + 2 * gainedBarBorder}px]`;
  return (
    <div className={heightClass}>
      <svg viewBox={`0 0 ${100 + 2 * capDistance} 10`} preserveAspectRatio="none">
        <line
          x1={capDistance}
          y1="5"
          x2={`${100 + capDistance}`}
          y2="5"
          stroke="rgb(var(--color-foreground-4))"
          stroke-width={remainingBarWidth}
          stroke-linecap="round"
        />
        <line x1={capDistance} y1="5" x2={percentGained} y2="5" stroke="#0E2825" stroke-width={gainedBarWidth + gainedBarBorder} stroke-linecap="round" />
        <line x1={capDistance} y1="5" x2={percentGained} y2="5" stroke="#C1F6FF" stroke-width={gainedBarWidth} stroke-linecap="round" />
      </svg>
    </div>
  );
};
