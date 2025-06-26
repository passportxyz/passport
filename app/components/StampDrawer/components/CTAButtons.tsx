import React from "react";
import { CTAButtonsProps } from "../types";
import { Button } from "../../Button";

export const CTAButtons = ({ platformInfo, verificationState, onVerify, onClose }: CTAButtonsProps) => {
  const { isVerified, isLoading, canSubmit } = verificationState;

  // Always show custom CTA if it exists
  if (platformInfo.cta && platformInfo.ctaHref) {
    return (
      <div className="mt-4 mx-1">
        <a href={platformInfo.ctaHref} target="_blank" rel="noopener noreferrer" className="inline-block w-full">
          <Button
            variant="custom"
            className="w-full bg-background text-color-4 font-medium rounded-lg hover:bg-foreground-2 transition-colors px-5 py-2"
          >
            {platformInfo.cta}
          </Button>
        </a>
      </div>
    );
  }

  // Show Verify if not verified, Close if verified
  return (
    <div className="mt-4 mx-1">
      {isVerified ? (
        <Button
          variant="custom"
          onClick={onClose}
          className="w-full bg-background text-color-4 font-medium rounded-lg hover:bg-foreground-2 transition-colors px-5 py-2"
        >
          Close
        </Button>
      ) : (
        <Button
          variant="custom"
          onClick={onVerify}
          disabled={!canSubmit || isLoading}
          className="w-full bg-background text-color-4 font-medium rounded-lg hover:bg-foreground-2 transition-colors px-5 py-2 disabled:opacity-50"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {isLoading ? "Verifying..." : "Verify"}
        </Button>
      )}
    </div>
  );
};
