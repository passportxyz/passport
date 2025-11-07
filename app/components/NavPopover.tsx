import React, { Fragment, ReactNode, useRef, useLayoutEffect, useState } from "react";
import { Popover, Transition } from "@headlessui/react";
import { createPortal } from "react-dom";

interface NavPopoverProps {
  label: string;
  icon: ReactNode;
  children: ReactNode;
  size?: "full" | "compact";
}

export const NavPopover: React.FC<NavPopoverProps> = ({ label, icon, children, size }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [buttonLeft, setButtonLeft] = useState(0);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    // Get or create portal container
    let container = document.getElementById("nav-popover-portal");
    if (!container) {
      container = document.createElement("div");
      container.id = "nav-popover-portal";
      container.style.position = "fixed";
      container.style.bottom = "0";
      container.style.left = "0";
      container.style.pointerEvents = "none";
      container.style.zIndex = "50";
      document.body.appendChild(container);
    }
    setPortalContainer(container);

    // Track button position
    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setButtonLeft(rect.left);
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, []);

  return (
    <Popover className="relative">
      {({ open }) => {
        const shouldElevate = open || isHovered;
        const panelWidth = size === "compact" ? 479 : 737;

        return (
          <>
            <Popover.Button
              ref={buttonRef}
              className={`flex gap-2 items-center px-3 py-1 transition-all focus:outline-none relative ${
                open ? "bg-white rounded-t-lg z-[51]" : "bg-white rounded-lg"
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

            {portalContainer &&
              createPortal(
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
                    className="fixed z-50 transform"
                    style={{
                      width: `${panelWidth}px`,
                      top: `99px`, // Position just below header buttons
                      left: `min(${buttonLeft - 32}px, calc(100vw - ${panelWidth}px - 20px))`,
                      pointerEvents: "auto",
                    }}
                  >
                    {children}
                  </Popover.Panel>
                </Transition>,
                portalContainer
              )}
          </>
        );
      }}
    </Popover>
  );
};
