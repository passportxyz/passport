import React, { Fragment, ReactNode } from "react";
import { Popover, Transition } from "@headlessui/react";

interface NavPopoverProps {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}

export const NavPopover: React.FC<NavPopoverProps> = ({ label, icon, children }) => {
  return (
    <Popover className="relative">
      {({ open }) => (
        <>
          <Popover.Button
            className={`flex gap-2 items-center px-3 py-1 transition-all focus:outline-none border border-transparent ${
              open ? "bg-white rounded-t-lg shadow-md" : "rounded-lg hover:bg-gray-100 hover:shadow-md"
            }`}
          >
            {icon}
            <span className="text-black">{label}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`transition-all ${open ? "-rotate-180" : "rotate-0"}`}
            >
              <path
                d="M15 12.5L10 7.5L5 12.5"
                stroke="#0A0A0A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
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
            <Popover.Panel className="fixed top-20 z-50 w-[737px] left-0 right-0 mx-auto lg:absolute lg:top-full lg:-left-8 lg:right-auto lg:mx-0">
              {children}
            </Popover.Panel>
          </Transition>
        </>
      )}
    </Popover>
  );
};
