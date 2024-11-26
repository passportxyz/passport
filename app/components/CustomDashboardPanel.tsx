import React, { ReactElement, ReactNode, useMemo, useState } from "react";
import { VeraxPanel } from "../components/VeraxPanel";
import { TestingPanel } from "../components/TestingPanel";
import { Button } from "../components/Button";
import { CustomizationLogoBackground } from "../utils/customizationUtils";
import { useCustomization } from "../hooks/useCustomization";
import { OnchainSidebar } from "./OnchainSidebar";
import { renderToString } from "react-dom/server";
import Tooltip from "./Tooltip";

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
    <div className={`${className} flex rounded border border-customization-background-1`}>
      <div className="grid shrink border-r border-customization-background-1 bg-gradient-to-b from-transparent to-customization-background-1/[.4]">
        <div className="flex col-start-1 row-start-1 flex-col items-center justify-center p-6">
          {logo.image}
          {logo.caption && <span className="mt-1 text-3xl leading-none">{logo.caption}</span>}
        </div>
        {logoBackground && <div className="col-start-1 flex row-start-1 z-0">{logoBackground}</div>}
      </div>
      <div className="relative flex flex-col justify-start gap-2 bg-gradient-to-b from-transparent to-customization-background-2/[.26] p-6 w-full">
        {children}
      </div>
    </div>
  );
};

export const DynamicCustomDashboardPanel = ({ className }: { className: string }) => {
  const customization = useCustomization();
  const [showSidebar, setShowSidebar] = useState<boolean>(false);

  if (customization.key === "verax") {
    return <VeraxPanel className={className} />;
  }

  if (customization.key === "testing") {
    return <TestingPanel className={className} />;
  }
  const { logo, body } = customization.dashboardPanel;

  const onButtonClick = () => {
    if (body.action?.type === "Onchain Push") {
      setShowSidebar(true);
    } else {
      window.open(body.action.url, "_blank");
    }
  };

  return (
    <CustomDashboardPanel className={className} logo={logo}>
      {body.displayInfoTooltip && body.displayInfoTooltip.shouldDisplay && body.displayInfoTooltip.text ? (
        <Tooltip
          iconClassName="text-customization-background-1"
          className="absolute top-2 right-2"
          panelClassName="border-customization-background-1"
        >
          {body.displayInfoTooltip.text}
        </Tooltip>
      ) : null}
      {body.mainText}
      <div className="text-sm grow">{body.subText}</div>
      <Button
        variant="custom"
        className={`rounded-s mr-2 mt-2 w-fit self-end bg-customization-background-3 text-customization-foreground-2 hover:bg-customization-background-3/75 disabled:bg-customization-background-1 disabled:brightness-100`}
        onClick={onButtonClick}
      >
        {body.action.text}
      </Button>
      <OnchainSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
    </CustomDashboardPanel>
  );
};
