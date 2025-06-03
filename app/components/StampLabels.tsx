import React from "react";

interface StampLabelsProps {
  primaryLabel: string;
  primaryBgColor: string;
  isDeduplicated?: boolean;
}

/**
 * Shared component for rendering stamp status labels.
 * Displays the primary label (Verified/Expired) and optionally
 * a deduplication label when applicable.
 */
export const StampLabels = ({ primaryLabel, primaryBgColor, isDeduplicated }: StampLabelsProps) => (
  <div className="flex gap-2">
    <div className={`${primaryBgColor} px-2 py-1 rounded text-right font-alt text-black`}>
      <p className="text-xs" data-testid={`${primaryLabel.toLowerCase()}-label`}>
        {primaryLabel}
      </p>
    </div>
    {isDeduplicated && (
      <div className="bg-background-4 px-2 py-1 rounded text-right font-alt text-black">
        <p className="text-xs" data-testid="deduped-label">
          Claimed by another wallet
        </p>
      </div>
    )}
  </div>
);
