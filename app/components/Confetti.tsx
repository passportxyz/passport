import React, { useContext, useState, useEffect } from "react";
import ReactConfetti from "react-confetti";
import { mutableUserVerificationAtom } from "../context/userState";
import { useAtom } from "jotai";
import { ScorerContext } from "../context/scorerContext";
import { colors } from "../utils/theme/palette";

function getWindowDimensions() {
  const { innerWidth: width } = window;
  const scrollableHeight = document.body.offsetHeight;
  return {
    width,
    height: scrollableHeight,
  };
}

export const Confetti: React.FC = () => {
  const [verificationState] = useAtom(mutableUserVerificationAtom);
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());
  const [showConfetti, setShowConfetti] = useState(false);
  const { rawScore, threshold } = useContext(ScorerContext);

  useEffect(() => {
    setShowConfetti(!verificationState.loading && rawScore >= threshold);
    setWindowDimensions(getWindowDimensions());
  }, [verificationState, rawScore, threshold]);

  if (!showConfetti) {
    return null;
  }

  return (
    <div data-testid="react-confetti">
      <ReactConfetti
        width={windowDimensions.width}
        height={windowDimensions.height - 100}
        numberOfPieces={4000}
        recycle={false}
        run={true}
        confettiSource={{
          x: 0,
          y: 0,
          w: windowDimensions.width,
          h: windowDimensions.height,
        }}
        colors={Object.values(colors)}
      />
    </div>
  );
};
