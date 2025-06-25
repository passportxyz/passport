import React from "react";
import { PointsModuleProps } from "../types";

const TimeIcon = () => (
  <svg className="w-5 h-5 text-color-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export const PointsModule = ({
  variant,
  timeToGet,
  price,
  pointsGained = 0,
  totalPossiblePoints = 1,
  validityDays,
  compact = false,
}: PointsModuleProps) => {
  if (variant === "pre-verification") {
    return (
      <div className="space-y-4">
        {/* Points progress section */}
        <div>
          <div className="text-4xl font-bold text-color-4 mb-3">
            0<span className="text-base font-normal text-color-9">/{totalPossiblePoints} points gained</span>
          </div>
          <div className="h-2 bg-gray-300 rounded-full overflow-hidden">
            <div className="h-full bg-color-9 rounded-full transition-all duration-300" style={{ width: "0%" }} />
          </div>
        </div>

        {/* Time and Price info */}
        {(timeToGet || price) && (
          <div className="flex items-center gap-8 pt-2">
            {timeToGet && (
              <div className="flex items-center gap-2 flex-1">
                <TimeIcon />
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Time to get</div>
                  <div className="text-base font-medium text-gray-900">{timeToGet}</div>
                </div>
              </div>
            )}
            {price && (
              <div className="flex items-center gap-2 flex-1">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-600">$</span>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-0.5">Price</div>
                  <div className="text-base font-medium text-gray-900">{price}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Post-verification state
  return (
    <div className="bg-foreground-4 rounded-2xl p-6 text-color-1">
      <div className={`flex items-center ${compact ? "flex-col" : "justify-between"}`}>
        <div className={compact ? "text-center" : ""}>
          <div className={`${compact ? "text-2xl" : "text-3xl"} font-bold`}>
            {pointsGained}
            <span className={`${compact ? "text-base" : "text-lg"} font-normal opacity-80`}>
              /{totalPossiblePoints} points gained
            </span>
          </div>
          <div className="h-2 bg-white bg-opacity-20 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-white bg-opacity-90 rounded-full transition-all duration-300"
              style={{ width: `${(pointsGained / totalPossiblePoints) * 100}%` }}
            />
          </div>
        </div>
        {validityDays && !compact && (
          <div className="flex items-center gap-2 text-sm opacity-90">
            <TimeIcon />
            Valid for {validityDays} more days
          </div>
        )}
      </div>
      {validityDays && compact && (
        <div className="flex items-center justify-center gap-2 text-sm opacity-90 mt-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          {validityDays}d
        </div>
      )}
    </div>
  );
};
