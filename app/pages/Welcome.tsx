/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useState, useEffect } from "react";

// --- Utils
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { useCustomization, useNavigateToPage } from "../hooks/useCustomization";
import { useAccount } from "wagmi";
import { InitialScreenWelcome } from "../components/InitialScreenLayout";
import { Button } from "../components/Button";
import Checkbox from "../components/Checkbox";

export default function Welcome() {
  const [skipNextTime, setSkipNextTime] = useState(false);

  const { dbAccessTokenStatus } = useDatastoreConnectionContext();
  const { address } = useAccount();
  const { scorer, hideHumnBranding } = useCustomization();
  const threshold = scorer?.threshold;
  const navigateToPage = useNavigateToPage();

  // Route user to home page when wallet is disconnected
  useEffect(() => {
    if (!address || dbAccessTokenStatus !== "connected") {
      navigateToPage("home");
    }
  }, [address]);

  return (
    <InitialScreenWelcome imgUrl="/assets/hmnOnboardImage.svg">
      <div className="mb-4 text-2xl leading-none md:text-6xl font-bold font-alt">Understanding Your Points</div>
      <div className="text-lg">
        <p>
          When you complete Stamps, you earn both <span className="font-bold">Unique Humanity Points</span> and{" "}
          <span className="font-bold">HUMN Points</span> simultaneously.{" "}
        </p>
        <p className="pt-4">
          <span className="font-bold">Unique Humanity Points</span> prove you&apos;re human and unlock access to web3
          programs. You need a score of {!!threshold ? threshold : "20+"} to get verified and start accessing web3
          opportunities.
        </p>
        {!hideHumnBranding && (
          <>
            <p className="pt-4">
              <span className="font-bold">HUMN Points</span> are your rewards balance. These accumulate in your account
              across the human.tech tools and will unlock exclusive benefits and rewards in upcoming programs.
            </p>
            <p className="pt-4">
              <span className="font-bold">To earn HUMN Points,</span> you must build up a Unique Humanity score of 20+.
            </p>
            <div className="pt-6 underline text-color-9">
              <a href="https://passport.human.tech/blog/humn-onchain-sumr-season-1-is-live" target="_blank">
                Learn more about HUMN Points
              </a>
            </div>
          </>
        )}
      </div>

      <Button className="px-16" onClick={() => navigateToPage("dashboard")}>
        Next{" "}
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M5 12H19M19 12L12 5M19 12L12 19"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Button>
      <div className="mt-8 flex justify-center md:justify-start text-color-9">
        <Checkbox
          id="skip-next-time"
          checked={skipNextTime}
          onChange={(checked) => {
            if (checked) {
              const now = Math.floor(Date.now() / 1000);
              localStorage.setItem("onboardTS", now.toString());
              setSkipNextTime(true);
            } else {
              localStorage.removeItem("onboardTS");
              setSkipNextTime(false);
            }
          }}
        />
        <label htmlFor="skip-next-time" className="pl-2 text-sm">
          Skip this screen next time
        </label>
      </div>
    </InitialScreenWelcome>
  );
}
