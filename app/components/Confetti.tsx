import React, { useContext, useState, useEffect, useCallback } from "react";
import ReactConfetti from "react-confetti";
import { mutableUserVerificationAtom } from "../context/userState";
import { useAtom } from "jotai";
import { ScorerContext } from "../context/scorerContext";
import { colors } from "../utils/theme/palette";

const useWindowDimensions = () => {
  const getDimensions = useCallback(() => {
    const width = document.documentElement.clientWidth;
    const scrollableHeight = document.body.offsetHeight;
    return {
      width,
      height: scrollableHeight,
    };
  }, []);

  const [windowDimensions, setWindowDimensions] = useState(getDimensions());

  useEffect(() => {
    const onResize = () => {
      setWindowDimensions(getDimensions());
    };

    // run on mount to set initial state
    onResize();

    // remove existing event listeners
    window.removeEventListener("resize", onResize);

    // add listeners
    // passive stops the browser from waiting to see if the event
    // listener will call preventDefault() -- better for performance
    window.addEventListener("resize", onResize, { passive: true });

    // clean up on dismount
    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, [getDimensions]);

  return { windowDimensions };
};

export const Confetti: React.FC = () => {
  const [verificationState] = useAtom(mutableUserVerificationAtom);
  const { windowDimensions } = useWindowDimensions();
  const [showConfetti, setShowConfetti] = useState(false);
  const { rawScore, threshold } = useContext(ScorerContext);

  useEffect(() => {
    setShowConfetti(!verificationState.loading && threshold > 0 && rawScore >= threshold);
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
