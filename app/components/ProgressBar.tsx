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

  const gainedBarWidth = isSlim ? 8 : 12;
  const remainingBarWidth = 8;
  const barHeight = Math.max(gainedBarWidth, remainingBarWidth);

  return (
    <div style={{ height: `${barHeight}px`, width: "100%", position: "relative" }}>
      {/* Background bar */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          left: 0,
          right: 0,
          height: `${remainingBarWidth}px`,
          backgroundColor: availableBarColor,
          borderRadius: `${remainingBarWidth / 2}px`,
        }}
      />
      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          transform: "translateY(-50%)",
          left: 0,
          width: `${percentGained}%`,
          height: `${gainedBarWidth}px`,
          backgroundColor: gainedBarColor,
          borderRadius: `${gainedBarWidth / 2}px`,
        }}
      />
    </div>
  );
};
