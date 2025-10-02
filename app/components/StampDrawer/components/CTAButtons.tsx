import React from "react";
import { useAccount, useSignMessage, useSendTransaction, useSwitchChain } from "wagmi";
import { CTAButtonsProps } from "../types";
import { Button } from "../../Button";

export const CTAButtons = ({ platformSpec, verificationState, onVerify, onClose }: CTAButtonsProps) => {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();
  const { isVerified, isLoading } = verificationState;

  // Always show custom CTA if it exists
  if (platformSpec.cta) {
    const { cta } = platformSpec;
    const buttonClassName =
      "w-full bg-background text-color-4 font-medium rounded-lg hover:bg-foreground-2 transition-colors px-5 py-2";

    // Handle href-based CTA (external link)
    if ("href" in cta) {
      return (
        <div className="mt-4 mx-1">
          <a href={cta.href} target="_blank" rel="noopener noreferrer" className="inline-block w-full">
            <Button variant="custom" className={buttonClassName}>
              {cta.label}
            </Button>
          </a>
        </div>
      );
    }

    // Handle onClick-based CTA (in-page action)
    else if ("onClick" in cta) {
      return (
        <div className="mt-4 mx-1">
          <Button
            variant="custom"
            onClick={
              address
                ? () => cta.onClick({ address, signMessageAsync, sendTransactionAsync, switchChainAsync })
                : undefined
            }
            className={buttonClassName}
          >
            {cta.label}
          </Button>
        </div>
      );
    }
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
          disabled={isLoading}
          className="w-full bg-background text-color-4 font-medium rounded-lg hover:bg-foreground-2 transition-colors px-5 py-2 disabled:opacity-50"
        >
          {isLoading ? "Verifying..." : "Check Eligibility"}
        </Button>
      )}
    </div>
  );
};
