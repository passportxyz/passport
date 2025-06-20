import React, { useState } from "react";
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react";
import { twMerge } from "tailwind-merge";

const TextAlignedInfoIcon = ({ className }: { className?: string }): JSX.Element => (
  <div className={`relative ${className}`}>
    <svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12.5 16V12M12.5 8H12.51M22.5 12C22.5 17.5228 18.0228 22 12.5 22C6.97715 22 2.5 17.5228 2.5 12C2.5 6.47715 6.97715 2 12.5 2C18.0228 2 22.5 6.47715 22.5 12Z"
        stroke="#737373"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
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
            "z-10 w-4/5 px-4 py-2 max-w-screen-md rounded-md border border-foreground-6 bg-background text-sm",
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
