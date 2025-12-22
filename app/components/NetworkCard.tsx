import React from "react";
import { SyncToChainButton } from "./SyncToChainButton";
import { Chain } from "../utils/chains";
import { useOnChainStatus } from "../hooks/useOnChainStatus";
import { OnChainStatus } from "../utils/onChainStatus";
import { getDaysToExpiration } from "../utils/duration";

import { useOnChainData } from "../hooks/useOnChainData";
import { Hyperlink } from "@gitcoin/passport-platforms";
import { useAccount } from "wagmi";
import { ExpiredLabel } from "./LabelExpired";

export function NetworkCard({ chain }: { chain: Chain }) {
  const { status, isPending } = useOnChainStatus({ chain });
  const { expirationDate } = useOnChainData().data[chain.id] || {};
  const { address } = useAccount();

  const isOnChain = [
    OnChainStatus.MOVED_OUT_OF_DATE,
    OnChainStatus.MOVED_UP_TO_DATE,
    OnChainStatus.MOVED_EXPIRED,
  ].includes(status);

  const expired = status === OnChainStatus.MOVED_EXPIRED;
  const showButton = true; // We always show the button atm ... status === OnChainStatus.MOVED_EXPIRED || status === OnChainStatus.NOT_MOVED;
  const hasAttestation =
    status === OnChainStatus.MOVED_EXPIRED ||
    status === OnChainStatus.MOVED_OUT_OF_DATE ||
    status === OnChainStatus.MOVED_UP_TO_DATE;

  let background = "bg-background";

  if (isOnChain) {
    if (expired) {
      background = "bg-[#e5e5e5]";
    } else {
      background = "bg-emerald-100";
    }
  }

  const daysUntilExpiration = getDaysToExpiration({
    expirationDate: expirationDate || "",
  });

  return (
    <div className={`mb-6 rounded-lg border p-2 align-middle ${background}`}>
      <div className="mx-2 my-2 h-full">
        <div className="grid grid-rows-3 content-between h-full">
          <div className="flex justify-between items-start">
            <img className="h-8" src={chain.icon} alt={`${chain.label} logo`} />
            {expired && <ExpiredLabel className="" />}
          </div>
          <div className="">
            <h1 className="grow font-medium text-lg">{chain.label}</h1>
          </div>
          <SyncToChainButton
            onChainStatus={status}
            chain={chain}
            isLoading={isPending}
            className={`mb-2 ${!showButton ? "hidden" : ""}`}
          />
          <div className={`mb-2 flex w-full justify-between ${hasAttestation ? "" : "hidden"}`}>
            {address && chain.attestationProvider?.hasWebViewer && (
              <Hyperlink
                href={chain.attestationProvider?.viewerUrl(address) || ""}
                className={`leading-none ${expired ? "text-inherit" : ""} text-xs flex items-center`}
              >
                <span className="text-nowrap">{chain.attestationProvider?.attestationExplorerLinkText}</span>
                <svg width="20" height="20" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M7.66699 7H17.667M17.667 7V17M17.667 7L7.66699 17"
                    stroke="black"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Hyperlink>
            )}

            <div className={`flex justify-end pl-2 text-color-9 items-center text-xs ${expired ? "hidden" : ""}`}>
              <svg width="20" height="20" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.5 12.332C3.5 14.1121 4.02784 15.8521 5.01677 17.3322C6.00571 18.8122 7.41131 19.9658 9.05585 20.6469C10.7004 21.3281 12.51 21.5064 14.2558 21.1591C16.0016 20.8118 17.6053 19.9547 18.864 18.696C20.1226 17.4373 20.9798 15.8337 21.3271 14.0878C21.6743 12.342 21.4961 10.5324 20.8149 8.88788C20.1337 7.24335 18.9802 5.83774 17.5001 4.8488C16.0201 3.85987 14.28 3.33203 12.5 3.33203C9.98395 3.3415 7.56897 4.32325 5.76 6.07203L3.5 8.33203M3.5 8.33203V3.33203M3.5 8.33203H8.5M12.5 7.33203V12.332L16.5 14.332"
                  stroke="black"
                  strokeOpacity="0.5"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="pt-0.5 min-w-14">
                Valid for<br></br>
                {daysUntilExpiration} {daysUntilExpiration === 1 ? "day" : "days"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
