import React, { useState } from "react";
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react";
import { twMerge } from "tailwind-merge";

const TextAlignedInfoIcon = ({ className }: { className?: string }): JSX.Element => (
  <div className={`relative top-[.125em] h-[1em] w-[1em] text-color-2 ${className}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 16 16" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
        clipRule="evenodd"
      />
    </svg>
  </div>
);

const Tooltip = ({
  children,
  className,
  panelClassName,
  iconClassName,
}: {
  children: React.ReactNode;
  className?: string;
  panelClassName?: string;
  iconClassName?: string;
}): JSX.Element => {
  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    middleware: [offset(6), flip(), shift({ padding: 24 })],
    whileElementsMounted: autoUpdate,
  });

  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        ref={refs.setReference}
        className={twMerge("w-fit", className)}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
      >
        <TextAlignedInfoIcon className={iconClassName} />
      </button>

      {isOpen && (
        <div
          ref={refs.setFloating}
          className={twMerge(
            "z-10 w-4/5 px-4 py-2 max-w-screen-md rounded-md border border-foreground-6 bg-background text-sm text-color-1",
            panelClassName
          )}
          style={floatingStyles}
        >
          {children}
        </div>
      )}
    </>
  );
};

export default Tooltip;
