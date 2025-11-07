import React, { Fragment, ReactNode } from "react";
import { Popover, Transition } from "@headlessui/react";

interface NavPopoverProps {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}

export const NavPopover: React.FC<NavPopoverProps> = ({ label, icon, children }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  return (
    <Popover className="relative">
      {({ open }) => {
        const shouldElevate = open || isHovered;

        return (
          <>
            <Popover.Button
              className={`flex gap-2 items-center px-3 py-1 transition-all focus:outline-none ${
                open ? "bg-white rounded-t-lg relative z-[51]" : "bg-white rounded-lg"
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
              enter="transition ease-out duration-100"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition ease-in duration-150"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Popover.Panel className="fixed top-20 z-50 w-[737px] left-0 right-0 mx-auto lg:absolute lg:top-full lg:-left-8 lg:right-auto lg:mx-0 lg:-mt-[1px]">
                {children}
              </Popover.Panel>
            </Transition>
          </>
        );
      }}
    </Popover>
  );
};
