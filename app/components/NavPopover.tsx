import React, { Fragment, ReactNode } from "react";
import { Popover, Transition } from "@headlessui/react";

interface NavPopoverProps {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  size?: "full" | "compact";
}

export const NavPopover: React.FC<NavPopoverProps> = ({ label, icon, children, size }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Popover>
      {({ open }) => {
        const shouldElevate = open || isHovered;
        const panelWidth = size === "compact" ? 479 : 737;

        return (
          <>
            <Popover.Button
              className={`flex gap-2 items-center px-3 py-1 transition-all focus:outline-none relative ${
                open ? "bg-white rounded-t-lg z-[51]" : "hover:bg-white bg-transparent rounded-lg"
              }`}
              style={
                shouldElevate
                  ? {
                      boxShadow: "0 3px 10px rgba(0, 0, 0, 0.12)",
                      ...(open && { clipPath: "inset(-10px -10px 0px -10px)" }),
                    }
                  : undefined
              }
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {icon}
              <span className="text-black">{label}</span>
            </Popover.Button>

            <Transition
              as={Fragment}
              show={open}
              enter="transition ease-out duration-200"
              enterFrom="opacity-0 translate-y-[-8px]"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-[-8px]"
            >
              <Popover.Panel
                className="absolute top-[47px] z-50 left-[-8px] right-0 mx-auto lg:left-32 lg:right-auto"
                style={{
                  width: `${panelWidth}px`,
                }}
              >
                {children}
              </Popover.Panel>
            </Transition>
          </>
        );
      }}
    </Popover>
  );
};
