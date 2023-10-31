import { useState } from "react";
import { WelcomeWrapper } from "./WelcomeWrapper";

export const InitialWelcome = ({
  onBoardFinished,
  dashboardCustomizationKey,
}: {
  onBoardFinished: () => void;
  dashboardCustomizationKey: string | null;
}) => {
  const [step, setStep] = useState(0);

  const onSkip = () => {
    setStep(0);
  };

  const welcomeSteps = [
    {
      header: "Welcome to Gitcoin Passport!",
      subHeader: "Privacy-First Verification",
      subHeaderIconSrc: "./assets/shieldLockIcon.svg",
      body: 'Passport helps you collect "stamps" that prove your humanity and reputation. You decide what stamps are shown. And your privacy is protected at each step of the way.',
      stepsConfig: {
        current: 1,
        total: 3,
      },
      buttonsConfig: {
        onSkip,
        onNext: () => setStep(1),
        dashboardCustomizationKey,
      },
    },
    {
      header: "Introducing Passport Scoring",
      subHeader: "Your Unique Humanity Score",
      subHeaderIconSrc: "./assets/hexagonIcon.svg",
      body: "Your Unique Humanity Score represents your trustworthiness to web3 projects. Increase your score to unlock higher quality experiences.",
      stepsConfig: {
        current: 2,
        total: 3,
      },
      buttonsConfig: {
        onSkip,
        onNext: () => setStep(2),
        dashboardCustomizationKey,
      },
    },
    {
      header: "Get Started",
      subHeader: "Verification Steps",
      subHeaderIconSrc: "./assets/lockIcon.svg",
      body: (
        <ol className="list-none">
          <ListItem number={1}>Verify your web3 stamps now with one-click verification.</ListItem>
          <ListItem number={2}>Verify any remaining web2 stamps.</ListItem>
          <ListItem number={3}>See your Unique Humanity Score increase.</ListItem>
        </ol>
      ),
      stepsConfig: {
        current: 3,
        total: 3,
      },
      buttonsConfig: {
        onSkip,
        onNext: () => onBoardFinished(),
        dashboardCustomizationKey,
        nextButtonText: "Verify stamps",
      },
    },
  ];

  const content = welcomeSteps[step];
  const body = content.body;

  return <WelcomeWrapper content={content}>{body}</WelcomeWrapper>;
};

const ListItem = ({ children, number }: { children: React.ReactNode; number: number }) => (
  <li className="flex items-start gap-2 py-1">
    <ListMarker number={number} />
    <div className="leading-6">{children}</div>
  </li>
);

const ListMarker = ({ number }: { number: number }) => (
  <div className="h-6 w-6">
    <svg width="24" height="25" className="col-start-1 row-start-1">
      <defs>
        <linearGradient id="Gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--color-foreground))" />
          <stop offset="100%" stopColor="rgb(var(--color-foreground-2))" />
        </linearGradient>
      </defs>
      <circle r="11" cx="12" cy="12" stroke="url(#Gradient)" strokeWidth="1" />
      <text x="50%" y="55%" textAnchor="middle" fill="white" dominantBaseline="middle">
        {number}
      </text>
    </svg>
  </div>
);
