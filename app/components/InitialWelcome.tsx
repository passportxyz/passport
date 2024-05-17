import { useState } from "react";
import { WelcomeWrapper } from "./WelcomeWrapper";
import { useNavigateToPage } from "../hooks/useCustomization";

export const InitialWelcome = ({
  onBoardFinished,
  hasPassports,
}: {
  onBoardFinished: () => void;
  hasPassports: boolean;
}) => {
  const [step, setStep] = useState(0);

  const onSkip = () => {
    setStep(0);
  };
  const navigateToPage = useNavigateToPage();

  const welcomeSteps = [
    {
      header: "Build Your Passport Score",
      backgroudIconSrc: "./assets/passportBackgroundLogo.svg",
      stampIcon: "./assets/gitcoin-flower.svg",
      scoreIcon: "./assets/passport_score.svg",
      body: "Your Passport Score verifies your Web3 and Web2 presence, opening up a realm of possibilities as you accumulate Stamps and build your score. A higher score equals greater trust, paving the way for you to engage with community programs and governance.",
      stepsConfig: {
        current: 1,
        total: 3,
      },
      buttonsConfig: {
        skipButtonText: "Skip",
        onSkip: () => {
          navigateToPage("dashboard");
        },
        onNext: () => setStep(1),
      },
    },
    {
      header: "Accumulate Verified Stamps",
      body: "Stamps affirm your identity and are key to accessing Web3's offerings. They are akin to digital visas, each one from a different verifier, showcasing your active participation. To obtain a Stamp, follow the specific verifier's process. Each Stamp you collect has a 90-day validity, symbolizing your ongoing engagement and ensuring the Passport's integrity.",
      backgroudIconSrc: "./assets/passportBackgroundLogo.svg",
      stampIcon: "./assets/stamp-cards.svg",
      displayPlatformCard: true,
      stepsConfig: {
        current: 2,
        total: 3,
      },
      buttonsConfig: {
        skipButtonText: "Back",
        onSkip: () => setStep(0),
        onNext: () => setStep(2),
      },
    },
    {
      header: hasPassports ? "Auto refresh" : "Get verified with one simple step",
      backgroudIconSrc: "./assets/passportBackgroundLogo.svg",
      stampIcon: "./assets/passport-flash.svg",
      body: (
        <p>
          <span className="text-color-6">Verify your identity with just one click.</span> Our system will check your ETH
          account for activities that match our Stamp criteria. This quick verification is your first step into a
          broader Web3 world, giving you immediate access to what you qualify for today. To keep up with our 90 day
          default expiry period for Stamps, you can re-verify whenever you need.
        </p>
      ),
      stepsConfig: {
        current: 3,
        total: 3,
      },
      buttonsConfig: {
        skipButtonText: "Back",
        onSkip: () => setStep(0),
        displaySkipBtn: hasPassports ? false : true,
        onNext: () => onBoardFinished(),
        nextButtonText: hasPassports ? "Get Started" : "Verify",
        showSkipNextTime: hasPassports ? true : false,
      },
    },
  ];

  const content = welcomeSteps[step];
  const body = content.body;

  return <WelcomeWrapper content={content}>{body}</WelcomeWrapper>;
};
