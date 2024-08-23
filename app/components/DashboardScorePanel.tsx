import React, { useCallback, useEffect, useRef } from "react";
import { ScorerContext } from "../context/scorerContext";

import { useCustomization } from "../hooks/useCustomization";
import { useAtom } from "jotai";
import { mutableUserVerificationAtom } from "../context/userState";
import { setInterval } from "timers";

const PanelDiv = ({ className, children }: { className: string; children: React.ReactNode }) => {
  return (
    <div
      className={`flex flex-col items-center p-4 w-full rounded-lg bg-gradient-to-t from-background to-foreground-5/[.4] ${className}`}
    >
      {children}
    </div>
  );
};

const LoadingScoreImage = () => <div>Low</div>;

const SuccessScoreImage = () => <div>Good</div>;

const Ellipsis = () => {
  const firstDotRef = useRef<HTMLDivElement>(null);
  const secondDotRef = useRef<HTMLDivElement>(null);
  const dotIntervalRef = useRef<any>(null);

  const [showFirstDot, setShowFirstDot] = React.useState(false);
  const [showSecondDot, setShowSecondDot] = React.useState(false);

  useEffect(() => {
    dotIntervalRef.current = setInterval(() => {
      setShowFirstDot(true);
      setTimeout(() => setShowFirstDot(false), 2000);
      setTimeout(() => {
        setShowSecondDot(true);
        setTimeout(() => setShowSecondDot(false), 1000);
      }, 1000);
    }, 3000);

    return () => clearInterval(dotIntervalRef.current);
  }, []);

  return (
    <div className="flex">
      .
      <div ref={firstDotRef} className={showFirstDot ? "visible" : "invisible"}>
        .
      </div>
      <div ref={secondDotRef} className={showSecondDot ? "visible" : "invisible"}>
        .
      </div>
    </div>
  );
};

export const DashboardScorePanel = ({ className }: { className: string }) => {
  const { rawScore, passportSubmissionState } = React.useContext(ScorerContext);
  const [verificationState, _setUserVerificationState] = useAtom(mutableUserVerificationAtom);
  const [displayScore, setDisplayScore] = React.useState(0);

  // This enables the animation on page load
  useEffect(() => {
    if (verificationState.loading) {
      setDisplayScore(0);
    } else {
      setDisplayScore(rawScore);
    }
  }, [rawScore, verificationState.loading]);

  const customization = useCustomization();
  const customTitle = customization?.scorerPanel?.title;
  // TODO
  const customText = customization?.scorerPanel?.text;

  const loading = true || passportSubmissionState === "APP_REQUEST_PENDING" || verificationState.loading;

  return (
    <PanelDiv className={className}>
      <div className="flex items-center w-full">
        <span className="grow">{customTitle || "Unique Humanity Score"}</span>
        <div>Tooltip</div>
      </div>
      <div className="flex grow items-center align-middle py-4">
        {loading ? (
          <>
            <LoadingScoreImage />
            <div className="flex">
              Updating score
              <Ellipsis />
            </div>
          </>
        ) : (
          <>
            <SuccessScoreImage />
            <span>{+displayScore.toFixed(2)}</span>
          </>
        )}
      </div>
    </PanelDiv>
  );
};

export const DashboardScoreExplanationPanel = ({ className }: { className: string }) => {
  return <div />;
};
