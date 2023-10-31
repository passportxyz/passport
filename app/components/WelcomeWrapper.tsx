import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./Button";
import { LoadButton } from "./LoadButton";
import { WebmVideo } from "./WebmVideo";

type WelcomePageButtonsProps = {
  dashboardCustomizationKey: string | null;
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
  buttonsConfig: WelcomePageButtonsProps;
  stepsConfig?: StepsConfig;
};

export type WelcomeWrapperProps = {
  content: Content;
  children: React.ReactNode;
};

export const WelcomeWrapper = ({ content, children }: WelcomeWrapperProps) => {
  return (
    <div className="grid grid-rows-[minmax(0,1fr)_min-content_minmax(0,2fr)]">
      <div className="row-start-1 row-end-4 p-4 text-lg text-color-1 md:row-start-2 md:row-end-3">
        <div className="flex h-full w-full auto-rows-min flex-col gap-2 md:grid md:grid-cols-2">
          <div className="row-start-2 flex flex-col gap-2">
            <div className="font-heading text-4xl text-color-1 md:text-5xl lg:text-6xl">{content.header}</div>
            <div className="flex items-center gap-2 text-xl text-color-2 md:text-2xl lg:text-5xl">
              <img className="h-9 w-9" src={content.subHeaderIconSrc} alt="Subheader Icon" />
              <p>{content.subHeader}</p>
            </div>
          </div>

          {/* Extra row span is for spacing */}
          <WebmVideo
            className="self-center md:col-start-2 md:row-span-5"
            src="./assets/onboarding.webm"
            fallbackSrc="./assets/onboarding.svg"
            alt="Welcome"
          />

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
  dashboardCustomizationKey,
  onSkip,
  onNext,
  nextButtonText,
  skipButtonText,
}: WelcomePageButtonsProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="grid w-full grid-cols-2 gap-4">
      <LoadButton
        data-testid="skip-for-now-button"
        className="col-span-full row-start-2 md:col-span-1 md:row-start-1"
        variant="secondary"
        isLoading={isLoading}
        onClick={() => {
          setIsLoading(true);
          navigate(`/dashboard${dashboardCustomizationKey ? `/${dashboardCustomizationKey}` : ""}`);
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
