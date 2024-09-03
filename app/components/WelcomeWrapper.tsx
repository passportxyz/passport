import React, { useState } from "react";
import { Button } from "./Button";
import { LoadButton } from "./LoadButton";
import Checkbox from "./Checkbox";

type WelcomePageButtonsProps = {
  onSkip: () => void;
  onNext: () => void;
  nextButtonText?: string;
  skipButtonText?: string;
  displaySkipBtn?: boolean;
  showSkipNextTime?: boolean;
};

type StepsConfig = {
  current: number;
  total: number;
};

export type Content = {
  header: string;
  subHeader?: string;
  subHeaderIconSrc?: string;
  backgroudIconSrc?: string;
  stampIcon?: string;
  scoreIcon?: string;
  displayPlatformCard?: boolean;
  buttonsConfig: WelcomePageButtonsProps;
  stepsConfig?: StepsConfig;
};

export type WelcomeWrapperProps = {
  content: Content;
  children: React.ReactNode;
};

const PlatformCard = ({}) => {
  const icon = "./assets/googleStampIcon.svg";
  const name = "Google";
  const description = "Connect to Google to verify your email address.";
  const possiblePoints = "0.53";
  return (
    <div className="p-2 relative rounded-lg shadow-lg ">
      <div className="flex items-center justify-between">
        <img src={icon} alt="Icon" className="h-7 w-7" />
        <div className="text-right">
          <h1 className="text-xl text-blue-400">{possiblePoints}</h1>
          <p className="text-xs text-white">Available points</p>
        </div>
      </div>
      <h2 className="mt-4 text-l font-bold text-blue-400">{name}</h2>
      <p className="mt-2 text-white text-xs">{description}</p>
    </div>
  );
};

export const WelcomeWrapper = ({ content, children }: WelcomeWrapperProps) => {
  return (
    <div className="overflow-auto md:pb-32 inline-block md:grid grid-rows-[minmax(0,1fr)_min-content_minmax(0,2fr)] grid-flow-rows">
      <div className="row-start-1 p-4 text-sm md:text-lg text-color-1 md:row-start-2">
        <div className="flex h-full w-full auto-rows-min flex-col gap-2 md:grid md:grid-cols-2">
          <div className="hidden md:flex row-start-2 flex-col gap-2 place-items-start">
            <div className="font-heading text-4xl text-foreground-2 md:text-5xl lg:text-7xl">{content.header}</div>
            <div className="flex justify-center gap-2 text-xl text-color-2 md:text-2xl lg:text-5xl">
              {content.subHeaderIconSrc ? (
                <img className="h-9 w-9" src={content.subHeaderIconSrc} alt="Subheader Icon" />
              ) : null}
              <p>{content.subHeader}</p>
            </div>
          </div>

          {/* Extra row span is for spacing */}
          <div className="self-start md:col-start-2 md:row-span-5 relative w-full h-[270px] md:h-[610px]">
            <img className="absolute inset-0 w-full h-full" src={content.backgroudIconSrc} alt="Background Icon" />
            {content.stampIcon ? (
              <img className="absolute inset-0 w-[340px] h-[380px] m-auto" src={content.stampIcon} alt="Stamp" />
            ) : null}
            {content.scoreIcon ? (
              <img className="absolute inset-0 w-[235px] h-[255] m-auto" src={content.scoreIcon} alt="Score" />
            ) : null}
            {content.displayPlatformCard ? (
              <div className="absolute inset-0 m-auto w-40 h-40 flex justify-center items-center">
                <PlatformCard />
              </div>
            ) : null}
          </div>

          <div className="flex md:hidden row-start-2 flex-col gap-2 place-items-start z-10">
            <div className="font-heading text-3xl text-foreground-2 ">{content.header}</div>
            <div className="flex justify-center gap-2 text-l text-color-2 ">
              {content.subHeaderIconSrc ? (
                <img className="h-9 w-9" src={content.subHeaderIconSrc} alt="Subheader Icon" />
              ) : null}
              <p>{content.subHeader}</p>
            </div>
          </div>

          <div className="flex grow flex-col justify-between gap-4 md:gap-8 z-10">
            <div>{children}</div>
            <WelcomePageButtons {...content.buttonsConfig} />
          </div>
        </div>
      </div>

      {content.stepsConfig && (
        <StepIndicator
          {...content.stepsConfig}
          className="z-10 fixed bottom-20 row-start-3 justify-self-center mb-10 hidden md:flex"
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
  displaySkipBtn = true,
  showSkipNextTime = false,
}: WelcomePageButtonsProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const [skipNextTime, setSkipNextTime] = useState(false);
  return (
    <div className="fixed md:relative px-4 pt-1 pb-4 bottom-0 left-0 w-full bg-background">
      <div className="grid w-full grid-cols-2 gap-4">
        {displaySkipBtn ? (
          <LoadButton
            data-testid="skip-for-now-button"
            className="col-span-1 md:col-span-2 md:row-start-1"
            variant="secondary"
            isLoading={isLoading}
            onClick={() => {
              setIsLoading(true);
              onSkip();
              setIsLoading(false);
            }}
          >
            {skipButtonText || "Skip for now"}
          </LoadButton>
        ) : null}

        <Button data-testid="next-button" onClick={onNext} className={`${displaySkipBtn?'col-span-1':'col-span-2'} md:col-span-2`}>
          {nextButtonText || "Next"}
        </Button>
      </div>

      {showSkipNextTime ? (
        <div className="mt-8 flex justify-center">
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
          <label htmlFor="skip-next-time" className="pl-2 font-alt text-sm">
            Skip this screen next time
          </label>
        </div>
      ) : null}
    </div>
  );
};
