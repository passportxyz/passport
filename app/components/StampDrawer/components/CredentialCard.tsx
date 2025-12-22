import React from "react";
import { CredentialCardProps } from "../types";
import { PassportPoints } from "../../PassportPoints";
import { BetaBadge } from "../../BetaBadge";

const ExpiredIcon = () => (
  <svg width="16" height="16" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M2.83301 10C2.83301 11.4834 3.27288 12.9334 4.09699 14.1668C4.9211 15.4001 6.09244 16.3614 7.46288 16.9291C8.83333 17.4968 10.3413 17.6453 11.7962 17.3559C13.251 17.0665 14.5874 16.3522 15.6363 15.3033C16.6852 14.2544 17.3995 12.918 17.6889 11.4632C17.9783 10.0083 17.8298 8.50032 17.2621 7.12987C16.6944 5.75943 15.7332 4.58809 14.4998 3.76398C13.2664 2.93987 11.8164 2.5 10.333 2.5C8.2363 2.50789 6.22382 3.32602 4.71634 4.78333L2.83301 6.66667M2.83301 6.66667V2.5M2.83301 6.66667H6.99967M10.333 5.83333V10L13.6663 11.6667"
      stroke="black"
      strokeOpacity="0.5"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DedupIcon = () => (
  <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_19026_13087)">
      <path
        d="M10.0003 9.99935L15.0003 14.9993M10.0003 14.9993L15.0003 9.99935M3.33366 13.3327C2.41699 13.3327 1.66699 12.5827 1.66699 11.666V3.33268C1.66699 2.41602 2.41699 1.66602 3.33366 1.66602H11.667C12.5837 1.66602 13.3337 2.41602 13.3337 3.33268M8.33366 6.66602H16.667C17.5875 6.66602 18.3337 7.41221 18.3337 8.33268V16.666C18.3337 17.5865 17.5875 18.3327 16.667 18.3327H8.33366C7.41318 18.3327 6.66699 17.5865 6.66699 16.666V8.33268C6.66699 7.41221 7.41318 6.66602 8.33366 6.66602Z"
        stroke="black"
        strokeOpacity="0.5"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_19026_13087">
        <rect width="20" height="20" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const InfoIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_19026_13092)">
      <path
        d="M7.99967 10.6673V8.00065M7.99967 5.33398H8.00634M14.6663 8.00065C14.6663 11.6826 11.6816 14.6673 7.99967 14.6673C4.31778 14.6673 1.33301 11.6826 1.33301 8.00065C1.33301 4.31875 4.31778 1.33398 7.99967 1.33398C11.6816 1.33398 14.6663 4.31875 14.6663 8.00065Z"
        stroke="#737373"
        strokeWidth="1.33333"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
    <defs>
      <clipPath id="clip0_19026_13092">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

interface FlagProps {
  icon: React.ComponentType;
  label: string;
  infoUrl?: string;
}

const Flag = ({ icon: Icon, label, infoUrl }: FlagProps) => {
  return (
    <div className="inline-flex items-center gap-1">
      <div className="inline-flex items-center gap-1.5 bg-white rounded-md px-2 py-1">
        <Icon />
        <span className="text-sm text-foreground-5 font-medium">{label}</span>
      </div>
      {infoUrl && (
        <a
          href={infoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-5 h-5 hover:opacity-80 transition-opacity"
        >
          <InfoIcon />
        </a>
      )}
    </div>
  );
};

export const CredentialCard = ({ name, description, verified, flags = [], points, isBeta }: CredentialCardProps) => {
  const hasExpiredFlag = flags.includes("expired");
  const hasDeduplicatedFlag = flags.includes("deduplicated");
  const hasFlags = flags.length > 0;
  const getsPoints = verified && !hasFlags;

  return (
    <div
      className={`rounded-xl p-4 transition-all duration-200 hover:scale-[1.01] hover:shadow-md ${
        getsPoints
          ? "bg-[#befee2] hover:bg-[#a8f8d5]"
          : hasFlags
            ? "bg-color-3 hover:bg-opacity-90"
            : "bg-background hover:shadow-lg"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-color-4 flex-1 min-w-0">{name}</h4>
        <PassportPoints
          className={hasFlags ? "bg-opacity-50" : "bg-opacity-100"}
          prefix={getsPoints ? "+" : ""}
          points={Number(points).toFixed(1).replace(/\.0$/, "")}
          size="sm"
        />
      </div>

      {(hasExpiredFlag || hasDeduplicatedFlag) && (
        <div className="flex gap-2 mt-2">
          {hasExpiredFlag && <Flag icon={ExpiredIcon} label="Expired" />}
          {hasDeduplicatedFlag && (
            <Flag
              icon={DedupIcon}
              label="Deduplicated"
              infoUrl="https://support.passport.xyz/passport-knowledge-base/common-questions/why-am-i-receiving-zero-points-for-a-verified-stamp"
            />
          )}
        </div>
      )}

      {description && <p className="text-xs text-color-9 mt-2 leading-relaxed">{description}</p>}

      {isBeta && (
        <div className="mt-2">
          <BetaBadge />
        </div>
      )}
    </div>
  );
};
