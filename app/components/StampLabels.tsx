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
    <div className={`${primaryBgColor} px-2 py-1 rounded text-right font-alt text-color-4`}>
      <p className="text-xs" data-testid={`${primaryLabel.toLowerCase()}-label`}>
        {primaryLabel}
      </p>
    </div>
    {isDeduplicated && (
      <a
        href="https://support.passport.xyz/passport-knowledge-base/common-questions/why-am-i-receiving-zero-points-for-a-verified-stamp"
        target="_blank"
        rel="noopener noreferrer"
        className="no-underline"
      >
        <div className="bg-foreground-7 px-2 py-1 rounded text-right font-alt text-color-4 cursor-pointer hover:bg-foreground-6 transition-colors">
          <p className="text-xs" data-testid="deduped-label">
            Deduplicated
          </p>
        </div>
      </a>
    )}
  </div>
);
