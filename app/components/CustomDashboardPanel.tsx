import React, { ReactNode, useMemo, useState } from "react";
import { TestingPanel } from "../components/TestingPanel";
import { Button } from "../components/Button";
import { CustomizationLogoBackground } from "../utils/customizationUtils";
import { useCustomization } from "../hooks/useCustomization";
import { OnchainSidebar } from "./OnchainSidebar";
import Tooltip from "./Tooltip";
import { useAllOnChainStatus } from "../hooks/useOnChainStatus";
import { twMerge } from "tailwind-merge";
import { VeraxPanel } from "./VeraxPanel";

type CustomDashboardPanelProps = {
  logo: {
    image: React.ReactNode;
    caption?: React.ReactNode;
    background?: CustomizationLogoBackground;
  };
  children: React.ReactNode;
  className: string;
};

const DotsBackground = ({ viewBox, className }: { viewBox: string; className: string }) => (
  <svg viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="10" cy="10" r="1.5" fill="#D9D9D9" fillOpacity="0.5" />
    <circle cx="40" cy="8" r="0.5" fill="#D9D9D9" fillOpacity="0.5" />
    <circle cx="20" cy="20" r="0.5" fill="#D9D9D9" fillOpacity="0.5" />
    <circle cx="08" cy="30" r="0.8" fill="#D9D9D9" fillOpacity="0.5" />
    <circle cx="46" cy="28" r="0.8" fill="#D9D9D9" fillOpacity="0.5" />
    <circle cx="44" cy="64" r="1.5" fill="#D9D9D9" fillOpacity="0.5" />
    <circle cx="02" cy="68" r="0.8" fill="#D9D9D9" fillOpacity="0.5" />
    <circle cx="18" cy="80" r="1.5" fill="#D9D9D9" fillOpacity="0.5" />
    <circle cx="35" cy="84" r="0.5" fill="#D9D9D9" fillOpacity="0.5" />
    <circle cx="08" cy="92" r="0.8" fill="#D9D9D9" fillOpacity="0.5" />
    <circle cx="46" cy="96" r="0.8" fill="#D9D9D9" fillOpacity="0.5" />
  </svg>
);

// Used as base for both API-defined and static panels
export const CustomDashboardPanel = ({ logo, className, children }: CustomDashboardPanelProps) => {
  const logoBackground = useMemo(() => {
    if (logo.background === "dots") {
      return (
        <>
          <DotsBackground viewBox="0 0 50 100" className="block md:hidden lg:block" />
          {/* 1:1 aspect ratio works better on medium screen */}
          <DotsBackground viewBox="0 15 50 65" className="hidden md:block lg:hidden" />
        </>
      );
    }
  }, [logo.background]);

  return (
    <div className={`${className} flex flex-row rounded border border-customization-background-1 text-color-4`}>
      {children}
    </div>
  );
};

export const DynamicCustomDashboardPanel = ({ className }: { className: string }) => {
  const customization = useCustomization();

  if (customization.key === "verax") {
    return <VeraxPanel className={className} />;
  }

  if (customization.key === "testing") {
    return <TestingPanel className={className} />;
  }

  const { dashboardPanel } = customization;

  if (dashboardPanel.body.action.type === "Onchain Push") {
    return <OnchainPushCustomDashboardPanel className={className} />;
  }

  return (
    <StandardCustomDashboardPanel
      className={className}
      {...dashboardPanel.body}
      actionText={dashboardPanel.body.action.text}
      onActionClick={() => window.open(dashboardPanel.body.action.url, "_blank")}
    />
  );
};

const OnchainPushCustomDashboardPanel = ({ className }: { className: string }) => {
  const customization = useCustomization();
  const { isPending, anyChainExpired } = useAllOnChainStatus();

  const [showSidebar, setShowSidebar] = useState<boolean>(false);

  return (
    <>
      <StandardCustomDashboardPanel
        className={className + (anyChainExpired ? " shadow-even-lg shadow-customization-background-1" : " shadow-none")}
        actionClassName={anyChainExpired ? "bg-focus text-color-1 hover:bg-focus/75 hover:text-color-1/75" : ""}
        mainText={customization.dashboardPanel.body.mainText}
        subText={customization.dashboardPanel.body.subText}
        actionText={
          isPending
            ? "Loading..."
            : anyChainExpired
              ? "Refresh Onchain Passport"
              : customization.dashboardPanel.body.action.text
        }
        onActionClick={() => setShowSidebar(true)}
      />
      <OnchainSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
    </>
  );
};

const StandardCustomDashboardPanel = ({
  className,
  actionClassName,
  mainText,
  subText,
  actionText,
  onActionClick,
}: {
  className: string;
  actionClassName?: string;
  mainText: ReactNode;
  subText: ReactNode;
  actionText: ReactNode;
  onActionClick: () => void;
}) => {
  const customization = useCustomization();
  const { logo, body, customDashboardPanelTitle } = customization.dashboardPanel;

  return (
    <div className={`${className} flex flex-col rounded-3xl text-color-4 bg-[#ffffff99] p-4 justify-between`}>
      <div className="flex flex-row items-center justify-end h-16">
        <div className="grow font-medium text-lg">{customDashboardPanelTitle}</div>
        <div className="flex bg-white p-2 rounded-md">
          <div className="h-10 [&_svg]:h-full">{logo.image}</div>
          {logo.caption && <span className="mt-1 text-3xl leading-none">{logo.caption}</span>}
        </div>
        {body.displayInfoTooltip && body.displayInfoTooltip.shouldDisplay && body.displayInfoTooltip.text ? (
          <Tooltip
            iconClassName="text-customization-background-1"
            className="pl-2 self-start"
            panelClassName="border-customization-background-1"
          >
            {body.displayInfoTooltip.text}
          </Tooltip>
        ) : null}
      </div>
      {mainText}
      <div className="flex items-center">
        <Button
          variant="custom"
          className={twMerge(
            "rounded-md mr-2 w-fit self-end bg-customization-background-3 text-customization-foreground-2 hover:bg-customization-background-3/75 disabled:bg-customization-background-1 disabled:brightness-100",
            actionClassName
          )}
          onClick={onActionClick}
        >
          {actionText}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 12H19M19 12L12 5M19 12L12 19"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Button>
        <div className="text-sm grow">{subText}</div>
      </div>
    </div>
  );
};
