/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React from "react";
import { ScorerContext } from "../context/scorerContext";

const ScoreRing = ({ className }: { className: string }) => {
  const { rawScore } = React.useContext(ScorerContext);
  return (
    <div className={`${className} grid place-items-center`}>
      <svg className="col-start-1 row-start-1" width="82" height="94" viewBox="0 0 81.40638795573723 94">
        {/* progress ring l = 43, r=7 */}
        <path
          className="translate-x-[3.5px] translate-y-[4.0px]"
          fill="transparent"
          stroke="currentColor"
          strokeWidth="8"
          strokeDasharray={255}
          strokeDashoffset={255 * (1 - rawScore / 100) - 6}
          d="M31.176914536239785 3.4999999999999996Q37.23909236273086 0 43.30127018922193 3.5L68.41600689897065 18Q74.47818472546172 21.5 74.47818472546172 28.5L74.47818472546172 57.5Q74.47818472546172 64.5 68.41600689897065 68L43.30127018922193 82.5Q37.23909236273086 86 31.17691453623979 82.5L6.06217782649107 68Q0 64.5 0 57.5L0 28.5Q0 21.5 6.062177826491071 18Z"
        ></path>
        {/* cover too-early start of progress ring l = 43, r=7 */}
        <path
          className="translate-x-[3.5px] translate-y-[4.0px]"
          fill="transparent"
          stroke="#09161a"
          strokeWidth="8"
          strokeDasharray={255}
          strokeDashoffset={249}
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
      <div className="col-start-1 row-start-1 text-2xl">{rawScore}</div>
    </div>
  );
};

export const DashboardScorePanel = ({ className }: { className: string }) => (
  <div
    className={`${className} flex flex-col rounded border border-foreground-3 bg-gradient-to-b from-background to-background-4`}
  >
    <div className="flex p-4">
      <img className="mr-2" src="/assets/personIcon.svg" />
      <span>Default Humanity Score</span>
    </div>
    <div className="my-2 h-[2px] w-full bg-gradient-to-r from-background-4 via-foreground-2 to-background-4" />
    <div className="flex grow items-center p-4 text-foreground-2">
      <ScoreRing className="shrink-0" />
      <div className="mx-6 h-3/4 w-[2px] shrink-0 bg-gradient-to-t from-background-4 via-foreground-2 to-background-4" />
      <p className="shrink">
        Your Unique Humanity Score is based out of 100 and measures your uniqueness. The current passing threshold is
        20. Scores may vary across different apps, especially due to abuse or attacks on the service.
      </p>
    </div>
  </div>
);
