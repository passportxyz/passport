import React, { useEffect } from "react";
import { ScorerContext } from "../context/scorerContext";

import { Spinner } from "@chakra-ui/react";
import { useCustomization } from "../hooks/useCustomization";
import { isDynamicCustomization } from "../utils/customizationUtils";

// Hexagon SVGs generated using https://codepen.io/wvr/pen/WrNgJp
// with the values listed below for each ring

// The SVG path starts before the first corner, but we
// want it to start at the top of the ring. So, we will
// cover it with a ring segment that matches the background
// and account for this earlyStartOffset in our calculations.
const earlyStartOffset = 6;

// dashes and dashoffset are used to create a progress ring
const dashLength = 255;

const ScoreRing = ({ className }: { className: string }) => {
  const { rawScore, passportSubmissionState } = React.useContext(ScorerContext);

  const [displayScore, setDisplayScore] = React.useState(0);

  // This enables the animation on page load
  useEffect(() => {
    setDisplayScore(rawScore);
  }, [rawScore]);

  return (
    <div className={`${className} grid place-items-center`}>
      <svg className="col-start-1 row-start-1" width="82" height="94" viewBox="0 0 81.40638795573723 94">
        {/* progress ring l = 43, r=7 */}
        <path
          className="translate-x-[3.5px] translate-y-[4.0px] transition-[stroke-dashoffset] delay-300 duration-1000 ease-in-out"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={dashLength}
          strokeDashoffset={dashLength * (1 - displayScore / 100) - earlyStartOffset}
          d="M31.176914536239785 3.4999999999999996Q37.23909236273086 0 43.30127018922193 3.5L68.41600689897065 18Q74.47818472546172 21.5 74.47818472546172 28.5L74.47818472546172 57.5Q74.47818472546172 64.5 68.41600689897065 68L43.30127018922193 82.5Q37.23909236273086 86 31.17691453623979 82.5L6.06217782649107 68Q0 64.5 0 57.5L0 28.5Q0 21.5 6.062177826491071 18Z"
        ></path>
        {/* cover too-early start of progress ring, backdrop combines */}
        {/* with next ring to match background color l = 43, r=7 */}
        <path
          className="translate-x-[3.5px] translate-y-[4.0px]"
          fill="transparent"
          stroke={displayScore < 100 ? "rgb(var(--color-background))" : "currentColor"}
          strokeWidth="8"
          strokeDasharray={dashLength}
          strokeDashoffset={dashLength - earlyStartOffset}
          d="M31.176914536239785 3.4999999999999996Q37.23909236273086 0 43.30127018922193 3.5L68.41600689897065 18Q74.47818472546172 21.5 74.47818472546172 28.5L74.47818472546172 57.5Q74.47818472546172 64.5 68.41600689897065 68L43.30127018922193 82.5Q37.23909236273086 86 31.17691453623979 82.5L6.06217782649107 68Q0 64.5 0 57.5L0 28.5Q0 21.5 6.062177826491071 18Z"
        ></path>
        {/* cover too-early start of progress ring, partial transparent color */}
        {/* combines with previous ring to match color l = 43, r=7 */}
        <path
          className="translate-x-[3.5px] translate-y-[4.0px]"
          fill="transparent"
          stroke={displayScore < 100 ? "rgb(var(--color-background-4) / .6)" : "currentColor"}
          strokeWidth="8"
          strokeDasharray={dashLength}
          strokeDashoffset={dashLength - earlyStartOffset}
          d="M31.176914536239785 3.4999999999999996Q37.23909236273086 0 43.30127018922193 3.5L68.41600689897065 18Q74.47818472546172 21.5 74.47818472546172 28.5L74.47818472546172 57.5Q74.47818472546172 64.5 68.41600689897065 68L43.30127018922193 82.5Q37.23909236273086 86 31.17691453623979 82.5L6.06217782649107 68Q0 64.5 0 57.5L0 28.5Q0 21.5 6.062177826491071 18Z"
        ></path>
        {/* inner ring l = 38, r=7 */}
        <path
          fill="transparent"
          stroke="currentColor"
          strokeWidth="2"
          className="translate-x-[7.8px] translate-y-[9px]"
          d="M26.846787517317594 3.4999999999999996Q32.90896534380867 0 38.97114317029974 3.5L59.75575286112626 15.5Q65.81793068761733 19 65.81793068761733 26L65.81793068761733 50Q65.81793068761733 57 59.75575286112626 60.5L38.97114317029974 72.5Q32.90896534380867 76 26.846787517317598 72.5L6.06217782649107 60.5Q0 57 0 50L0 26Q0 19 6.062177826491071 15.5Z"
        ></path>
        {/* outer ring l = 48, r=7 */}
        <path
          fill="transparent"
          stroke="currentColor"
          strokeWidth="2"
          d="M34.64101615137754 3.4999999999999996Q40.703193977868615 0 46.76537180435969 3.4999999999999996L75.34421012924616 20Q81.40638795573723 23.5 81.40638795573723 30.5L81.40638795573723 63.5Q81.40638795573723 70.5 75.34421012924616 74L46.76537180435969 90.5Q40.703193977868615 94 34.64101615137754 90.5L6.062177826491071 74Q0 70.5 0 63.5L0 30.5Q0 23.5 6.062177826491071 20Z"
        ></path>
      </svg>

      <div className="col-start-1 row-start-1 text-2xl">
        {passportSubmissionState === "APP_REQUEST_PENDING" ? (
          <div className="translate-y-1">
            <Spinner
              thickness="2px"
              speed="0.65s"
              emptyColor="rgb(var(--color-foreground-2)/.25)"
              color="rgb(var(--color-foreground-2)/.75)"
              size="lg"
            />
          </div>
        ) : (
          <span>{+displayScore.toFixed(2)}</span>
        )}
      </div>
    </div>
  );
};

export const DashboardScorePanel = ({ className }: { className: string }) => {
  const customization = useCustomization();
  const customTitle = isDynamicCustomization(customization) ? customization.scorerPanel?.title : undefined;
  const customText = isDynamicCustomization(customization) ? customization.scorerPanel?.text : undefined;

  return (
    <div
      className={`${className} flex flex-col border  border-foreground-6 text-foreground rounded bg-gradient-to-b from-background to-background-2`}
    >
      <div className="flex p-4 border-b border-foreground-6">
        <img alt="Person Icon" className="mr-2" src="/assets/personIcon.svg" />
        <span>{customTitle || "Default Humanity Score"}</span>
      </div>
      <div className="flex grow items-center text-foreground-2">
        <div className="border-r border-foreground-6 p-4 h-full flex items-center">
          <ScoreRing className="shrink-0" />
        </div>

        <p className="shrink p-4">
          {customText ||
            "Your Unique Humanity Score is based out of 100 and measures your uniqueness. The current passing threshold is 20. " +
              "Scores may vary across different apps, especially due to abuse or attacks on the service."}
        </p>
      </div>
    </div>
  );
};
