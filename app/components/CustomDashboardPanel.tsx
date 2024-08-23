import React, { useMemo, useState, Ref, ReactElement, JSXElementConstructor } from "react";
import { VeraxPanel } from "../components/VeraxPanel";
import { TestingPanel } from "../components/TestingPanel";
import { Button } from "../components/Button";
import { CustomizationLogoBackground } from "../utils/customizationUtils";
import { useCustomization } from "../hooks/useCustomization";
import { OnchainSidebar } from "./OnchainSidebar";
import { ExclamationCircleIcon } from "@heroicons/react/24/solid";
import { Popover } from "@headlessui/react";
import { usePopper } from "react-popper";
import { renderToString } from "react-dom/server";

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
        <div className="flex col-start-1 row-start-1 flex-col items-center justify-center p-6 z-10">
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
  const [referenceElement, setReferenceElement] = useState(null);
  const [popperElement, setPopperElement] = useState(null);

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    modifiers: [
      {
        name: "preventOverflow",
        options: {
          padding: 24,
        },
      },
    ],
  });

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
        <Popover className={`group cursor-pointer px-2 self-end  absolute top-0 right-0 p-2`}>
          <Popover.Button as="div" ref={setReferenceElement as unknown as Ref<HTMLButtonElement>}>
            <div className="mr-4 w-4 self-end">
              <ExclamationCircleIcon height={24} color={"rgb(var(--color-customization-background-1))"} />
            </div>
          </Popover.Button>
          <Popover.Panel
            ref={setPopperElement as unknown as Ref<HTMLDivElement>}
            className={`invisible z-20 max-w-screen-md rounded-md border border-customization-background-1 bg-background text-sm text-color-1 group-hover:visible`}
            style={styles.popper}
            {...attributes.popper}
            static
          >
            <div className="px-4 py-2">{body.displayInfoTooltip.text}</div>
          </Popover.Panel>
        </Popover>
      ) : null}
      <div
        dangerouslySetInnerHTML={{
          __html: renderToString(body.mainText as ReactElement<any, string | JSXElementConstructor<any>>) || "",
        }}
      />

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
