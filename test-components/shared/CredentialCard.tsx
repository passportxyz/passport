import React from "react";

interface CredentialCardProps {
  name: string;
  description?: string;
  verified: boolean;
  points: number;
  pointsDisplay: string;
  flags?: ("expired" | "deduplicated")[];
}

export const CredentialCard: React.FC<CredentialCardProps> = ({
  name,
  description,
  verified,
  points,
  pointsDisplay,
  flags = [],
}) => {
  const hasExpiredFlag = flags.includes("expired");
  const hasDeduplicatedFlag = flags.includes("deduplicated");

  const cardClasses = verified
    ? "bg-foreground-4 bg-opacity-20 border-foreground-4"
    : "bg-background border-foreground-3";

  return (
    <div className={`rounded-lg border p-4 transition-all hover:shadow-md ${cardClasses}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {verified && (
              <svg className="w-5 h-5 text-foreground-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            <h4 className="font-medium text-color-1">{name}</h4>
          </div>

          {/* Flags */}
          <div className="flex gap-2 mt-1">
            {hasExpiredFlag && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-color-7 bg-opacity-20 text-color-7">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Expired
              </span>
            )}
            {hasDeduplicatedFlag && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-color-9 bg-opacity-20 text-color-9">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Deduplicated
              </span>
            )}
          </div>

          {description && <p className="text-sm text-color-9 mt-2">{description}</p>}
        </div>

        {/* Points display */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <span
            className={`text-lg font-semibold ${verified && !hasDeduplicatedFlag ? "text-foreground-4" : "text-color-9"}`}
          >
            {pointsDisplay}
          </span>
          <svg className="w-5 h-5 text-color-9" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
