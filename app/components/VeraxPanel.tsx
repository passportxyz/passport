// --- React Methods
import React from "react";
import { useSyncToChainButton } from "../hooks/useSyncToChainButton";
import { OnChainStatus, useOnChainStatus } from "../hooks/useOnChainStatus";
import { chains } from "../utils/chains";
import { LoadButton } from "./LoadButton";

const VeraxLogo = () => (
  <svg width="64" height="56" viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.1082 0H0L15.8409 37.0131L24.395 17.7418L17.1082 0Z" fill="rgb(var(--color-foreground-7))" />
    <path d="M46.5404 0H63.0907L40.7172 55.5197H23.5539L46.5404 0Z" fill="rgb(var(--color-foreground-7))" />
  </svg>
);

const getButtonMsg = (onChainStatus: OnChainStatus): string => {
  switch (onChainStatus) {
    case OnChainStatus.NOT_MOVED:
      return "Push to Verax";
    case OnChainStatus.MOVED_OUT_OF_DATE:
      return "Update";
    case OnChainStatus.MOVED_UP_TO_DATE:
      return "Already pushed";
  }
};

const chain = chains.find(({ label }) => label === "Linea Goerli");

export const VeraxPanel = ({ className }: { className: string }) => {
  const onChainStatus = useOnChainStatus({ chain });

  const { props, syncingToChain, text, needToSwitchChain } = useSyncToChainButton({
    chain,
    onChainStatus,
    getButtonMsg,
  });

  return (
    <div
      className={`${className} flex rounded border border-foreground-7 ${
        onChainStatus === OnChainStatus.MOVED_UP_TO_DATE ? "text-foreground-7 brightness-50 saturate-50" : ""
      } ${
        onChainStatus === OnChainStatus.MOVED_OUT_OF_DATE ? "shadow-[0_0_15px_rgb(var(--color-foreground-7)/.75)]" : ""
      }`}
    >
      <div className="flex shrink flex-col items-center justify-center border-r border-foreground-7 bg-gradient-to-b from-transparent to-foreground-7/[.4] p-6">
        <VeraxLogo />
        <span className="mt-1 text-3xl leading-none">Verax</span>
      </div>
      <div className="flex flex-col justify-start gap-2 bg-gradient-to-b from-transparent to-foreground-7/[.26] p-6">
        {onChainStatus === OnChainStatus.NOT_MOVED ? (
          <>
            Verax is a community maintained public attestation registry on Linea. Push your Passport Stamps onto Verax
            to gain rewards for early adopters in the Linea ecosystem.
            <span className="text-xs text-foreground-7 brightness-[1.4]">
              This action requires ETH bridged to Linea Mainnet to cover network fees, as well as a $2 mint fee which
              goes to the Gitcoin treasury.
            </span>
          </>
        ) : (
          <p>
            Verax is used to store attestations that can be consumed by dapps, allowing them to easily compose
            attestations from many sources to derive powerful reputation
          </p>
        )}
        {needToSwitchChain && (
          <span className="text-xs text-foreground-7 brightness-[1.4]">
            You will be prompted to switch to {chain?.label} and sign the transaction.
          </span>
        )}
        <div className="grow" />
        <LoadButton
          {...props}
          isLoading={syncingToChain}
          variant="custom"
          className={`${props.className} rounded-s mr-2 mt-2 w-fit  self-end bg-foreground-7 text-color-4 hover:bg-foreground-7/75 enabled:hover:text-color-1 disabled:bg-foreground-7 disabled:brightness-100`}
        >
          {text}
        </LoadButton>
      </div>
    </div>
  );
};
