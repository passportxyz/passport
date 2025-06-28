import React, { useMemo } from "react";
import { DrawerFooterProps } from "../types";
import { Button } from "../../Button";

export const DrawerFooter = ({ onVerify, onClose, isLoading, isVerified }: DrawerFooterProps) => {
  const buttonContent = useMemo(() => {
    if (isLoading) {
      return (
        <>
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Verifying...
        </>
      );
    }

    if (isVerified) {
      return (
        <>
          <svg width="13" height="10" viewBox="0 0 13 10" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M1.55019 4.83333L4.31019 8.5L11.4502 1.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Verified
        </>
      );
    }

    return (
      <>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        Check Eligibility
      </>
    );
  }, [isLoading, isVerified]);

  return (
    <div className="border-t border-color-3 p-6 px-10 md:px-20 bg-foreground">
      <div className="flex flex-col md:flex-row md:justify-end gap-3">
        <Button variant="primary" onClick={onVerify} className="w-full md:w-auto" disabled={isLoading}>
          {buttonContent}
        </Button>
        <Button variant="secondary" onClick={onClose} className="w-full sm:hidden">
          Close
        </Button>
      </div>
    </div>
  );
};
