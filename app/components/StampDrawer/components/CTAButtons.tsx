import React from "react";
import { CTAButtonsProps } from "../types";

export const CTAButtons = ({ platformInfo, verificationState, onVerify, onClose }: CTAButtonsProps) => {
  const { isVerified, isLoading, canSubmit } = verificationState;

  if (platformInfo.cta && platformInfo.ctaHref) {
    // Custom CTA with Learn More
    return (
      <div className="mt-4 space-y-3">
        <a
          href={platformInfo.ctaHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 bg-foreground-2 text-background-4 font-semibold rounded-full hover:bg-foreground-3 transition-colors"
        >
          {platformInfo.cta}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
        <a href="#" className="inline-flex items-center gap-1 text-sm font-medium text-color-5 hover:underline ml-2">
          Learn More
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>
    );
  }

  // Standard Verify/Close buttons
  return (
    <div className="mt-4">
      {isVerified ? (
        <button
          onClick={onClose}
          className="px-6 py-2 bg-background-3 text-color-1 font-medium rounded-lg hover:bg-background-4 transition-colors"
        >
          Close
        </button>
      ) : (
        <button
          onClick={onVerify}
          disabled={!canSubmit || isLoading}
          className={`px-6 py-2 font-medium rounded-lg transition-colors ${
            canSubmit && !isLoading
              ? "bg-background-3 text-color-1 hover:bg-background-4"
              : "bg-foreground-6 text-color-3 cursor-not-allowed"
          }`}
        >
          {isLoading ? "Verifying..." : "Verify"}
        </button>
      )}
    </div>
  );
};
