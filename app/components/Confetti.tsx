import React, { useContext, useState, useEffect, useCallback } from "react";
import ReactConfetti from "react-confetti";
import { mutableUserVerificationAtom } from "../context/userState";
import { useAtom } from "jotai";
import { ScorerContext } from "../context/scorerContext";
import { colors } from "../utils/theme/palette";

const getDimensions = () => {
  const width = document.documentElement.clientWidth;
  const scrollableHeight = document.body.offsetHeight;
  return {
    width,
    height: scrollableHeight,
  };
};

export const Confetti: React.FC = () => {
  const [verificationState] = useAtom(mutableUserVerificationAtom);
  const [showConfetti, setShowConfetti] = useState(false);
  const { rawScore, threshold } = useContext(ScorerContext);

  const currentDimensions = getDimensions();

  useEffect(() => {
    setShowConfetti(!verificationState.loading && rawScore >= threshold);
  }, [verificationState, rawScore, threshold]);

  if (!showConfetti) {
    return null;
  }

  return (
    <div data-testid="react-confetti">
      <ReactConfetti
        width={currentDimensions.width}
        height={currentDimensions.height - 100}
        numberOfPieces={4000}
        recycle={false}
        run={true}
        confettiSource={{
          x: 0,
          y: 0,
          w: currentDimensions.width,
          h: currentDimensions.height,
        }}
        colors={Object.values(colors)}
      />
    </div>
  );
};
