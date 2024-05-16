import React, { useState } from "react";
import { Button } from "./Button";
import { LoadButton } from "./LoadButton";
import { WebmVideo } from "./WebmVideo";
import { useNavigateToPage } from "../hooks/useCustomization";

type WelcomePageButtonsProps = {
  onSkip: () => void;
  onNext: () => void;
  nextButtonText?: string;
  skipButtonText?: string;
};

type StepsConfig = {
  current: number;
  total: number;
};

export type Content = {
  header: string;
  subHeader: string;
  subHeaderIconSrc: string;
  backgroudIconSrc: string;
  stampIcon: string;
  scoreIcon: string;
  buttonsConfig: WelcomePageButtonsProps;
  stepsConfig?: StepsConfig;
};

export type WelcomeWrapperProps = {
  content: Content;
  children: React.ReactNode;
};

const PlatformCard = ({}) => {
  const platformClasses = "border-foreground-6";
  const platform_icon = "./assets/googleStampIcon.svg";
  const platform_name = "Google";
  const platform_description = "Connect to Google to verify your email address.";
  const platform_possiblePoints = "0.53";
  return (
    <div className="w-full h-full items-center justify-center">
      <div className="bg-gradient-to-b from-blue-900 to-blue-700 rounded-lg shadow-lg max-w-sm relative">
        <div className="flex w-full items-center justify-between">
          <img src={platform_icon} alt="Icon" className="h-10 w-10" />
          <div className="text-right">
            <h1 className="ttext-2xl text-color-2">7.57</h1>
            <p className="text-xs text-white">Available points</p>
          </div>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-blue-400">Google</h2>
        {/* <p className="mt-2 text-white">Stake GTC to boost your trust in the Gitcoin ecosystem.</p> */}
      </div>
    </div>
  );
};

export const WelcomeWrapper = ({ content, children }: WelcomeWrapperProps) => {
  return (
    <div className="grid grid-rows-[minmax(0,1fr)_min-content_minmax(0,2fr)]">
      <div className="row-start-1 row-end-4 p-4 text-lg text-color-1 md:row-start-2 md:row-end-3">
        <div className="flex h-full w-full auto-rows-min flex-col gap-2 md:grid md:grid-cols-2">
          <div className="row-start-2 flex flex-col gap-2">
            <div className="font-heading text-4xl text-foreground-2 md:text-5xl lg:text-7xl">{content.header}</div>
            <div className="flex items-center gap-2 text-xl text-color-2 md:text-2xl lg:text-5xl">
              {content.subHeaderIconSrc ? (
                <img className="h-9 w-9" src={content.subHeaderIconSrc} alt="Subheader Icon" />
              ) : null}
              <p>{content.subHeader}</p>
            </div>
          </div>

          {/* Extra row span is for spacing */}
          <div className="self-center md:col-start-2 md:row-span-5 relative w-full h-full">
            <img className="absolute inset-0 w-full h-full" src={content.backgroudIconSrc} alt="Background Icon" />
            <img className="absolute inset-0 w-64 h-64 m-auto" src={content.stampIcon} alt="Stamp" />
            {content.scoreIcon ? (
              <img className="absolute inset-0 w-32 h-32 m-auto" src={content.scoreIcon} alt="Score" />
            ) : null}
            <div className="absolute inset-0 w-32 h-32 justify-center m-auto">
              <PlatformCard />
            </div>
          </div>
          {/* <WebmVideo
            className="self-center md:col-start-2 md:row-span-5"
            src="./assets/onboarding.webm"
            fallbackSrc="./assets/onboarding.svg"
            alt="Welcome"
          /> */}

          <div className="flex grow flex-col justify-between gap-4 md:gap-8">
            <div>{children}</div>
            <WelcomePageButtons {...content.buttonsConfig} />
          </div>
        </div>
      </div>
      {content.stepsConfig && (
        <StepIndicator
          {...content.stepsConfig}
          className="row-start-3 mb-10 hidden self-end justify-self-center md:flex"
        />
      )}
    </div>
  );
};

const StepIndicator = ({ current, total, className }: StepsConfig & { className?: string }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    {Array.from({ length: total }, (_, i) => (
      <svg key={i} className="grid grid-cols-1" width="18" height="18">
        <circle
          r="9"
          cx="9"
          cy="9"
          fill={i + 1 === current ? "rgb(var(--color-background-3))" : "transparent"}
          className="transition-colors duration-1000"
        />
        <circle r="5" cx="9" cy="9" fill="rgb(var(--color-foreground-2))" />
      </svg>
    ))}
  </div>
);

const WelcomePageButtons = ({
  onSkip,
  onNext,
  nextButtonText,
  skipButtonText,
}: WelcomePageButtonsProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const navigateToPage = useNavigateToPage();

  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <LoadButton
        data-testid="skip-for-now-button"
        className="col-span-full row-start-2 md:col-span-1 md:row-start-1"
        variant="secondary"
        isLoading={isLoading}
        onClick={() => {
          setIsLoading(true);
          navigateToPage("dashboard");
          onSkip();
          setIsLoading(false);
        }}
      >
        {skipButtonText || "Skip for now"}
      </LoadButton>
      <Button data-testid="next-button" onClick={onNext} className="col-span-full md:col-span-1">
        {nextButtonText || "Next"}
      </Button>
    </div>
  );
};
