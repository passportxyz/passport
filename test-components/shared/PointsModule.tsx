import React from "react";

interface PointsModuleProps {
  variant: "pre-verification" | "post-verification";
  // Pre-verification props
  timeToGet?: string;
  price?: string;
  // Post-verification props
  pointsGained?: number;
  totalPossiblePoints?: number;
  validityDays?: number;
}

export const PointsModule: React.FC<PointsModuleProps> = ({
  variant,
  timeToGet,
  price,
  pointsGained,
  totalPossiblePoints,
  validityDays,
}) => {
  if (variant === "pre-verification") {
    return (
      <div className="bg-background rounded-lg border border-foreground-3 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {timeToGet && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-color-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <div className="text-xs text-color-9">Time to get</div>
                  <div className="text-sm font-medium text-color-1">{timeToGet}</div>
                </div>
              </div>
            )}
            {price && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-color-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <div className="text-xs text-color-9">Price</div>
                  <div className="text-sm font-medium text-color-1">{price}</div>
                </div>
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-color-1">
              0<span className="text-sm font-normal text-color-9">/{totalPossiblePoints || 1} points gained</span>
            </div>
            <div className="h-2 bg-foreground-3 rounded-full mt-2" style={{ width: "120px" }}>
              <div className="h-full bg-foreground-5 rounded-full" style={{ width: "0%" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Post-verification variant
  return (
    <div className="bg-background rounded-lg border-2 border-foreground-4 p-4">
      <div className="flex items-center justify-between">
        <div className="text-2xl font-bold text-color-1">
          {pointsGained}
          <span className="text-sm font-normal text-color-9">/{totalPossiblePoints} points gained</span>
        </div>
        {validityDays && (
          <div className="flex items-center gap-1 text-sm text-color-9">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Valid for {validityDays} more days
          </div>
        )}
      </div>
      <div className="h-2 bg-foreground-3 rounded-full mt-2">
        <div
          className="h-full bg-foreground-4 rounded-full transition-all duration-500"
          style={{ width: `${(pointsGained! / totalPossiblePoints!) * 100}%` }}
        />
      </div>
    </div>
  );
};
