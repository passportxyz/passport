import React from "react";
import { CredentialCardProps } from "../types";

const VerifiedCheckIcon = () => (
  <svg className="w-5 h-5 text-foreground-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const StarIcon = ({ verified }: { verified: boolean }) => (
  <svg className={`w-4 h-4 ${verified ? "text-color-1" : "text-color-9"}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const TimeIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const InfoIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

export const CredentialCard = ({
  name,
  description,
  verified,
  flags = [],
  points,
  pointsDisplay,
}: CredentialCardProps) => {
  const hasExpiredFlag = flags.includes("expired");
  const hasDeduplicatedFlag = flags.includes("deduplicated");

  return (
    <div
      className={`bg-color-6 border border-color-3 rounded-2xl p-4 transition-all hover:border-foreground-4 hover:shadow-md ${
        verified ? "bg-opacity-5 bg-foreground-4 border-opacity-30 border-foreground-4" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {verified && <VerifiedCheckIcon />}
          <h4 className="text-sm font-semibold text-color-4 flex-1 min-w-0">{name}</h4>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className={`${verified && !hasDeduplicatedFlag ? "" : "opacity-50"}`}>
            <StarIcon verified={verified && !hasDeduplicatedFlag} />
          </span>
          <span
            className={`text-sm font-medium px-2 py-0.5 rounded-full ${
              verified && !hasDeduplicatedFlag
                ? "bg-foreground-4 text-color-1"
                : "bg-color-3 bg-opacity-20 text-color-9"
            }`}
          >
            {pointsDisplay}
          </span>
        </div>
      </div>

      {(hasExpiredFlag || hasDeduplicatedFlag) && (
        <div className="flex gap-2 mt-2">
          {hasExpiredFlag && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-color-7 bg-opacity-10 text-color-7 text-xs font-medium rounded-full">
              <TimeIcon />
              Expired
            </span>
          )}
          {hasDeduplicatedFlag && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-color-5 bg-opacity-10 text-color-5 text-xs font-medium rounded-full">
              <InfoIcon />
              Deduplicated
            </span>
          )}
        </div>
      )}

      {description && <p className="text-xs text-color-9 mt-2 leading-relaxed">{description}</p>}
    </div>
  );
};
