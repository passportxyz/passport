import React, { useState } from "react";
import { autoUpdate, flip, offset, shift, useFloating } from "@floating-ui/react";
import { twMerge } from "tailwind-merge";

const TooltipOverChildren = ({
  children,
  tooltipElement,
  className,
  panelClassName,
}: {
  children: React.ReactNode;
  tooltipElement: React.ReactNode;
  className?: string;
  panelClassName?: string;
}): JSX.Element => {
  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    middleware: [offset(6), flip(), shift({ padding: 24 })],
    whileElementsMounted: autoUpdate,
  });

  const [mouseIsOverChildren, setMouseIsOverChildren] = useState(false);
  const [mouseIsOverTooltip, setMouseIsOverTooltip] = useState(false);

  const isOpen = mouseIsOverChildren || mouseIsOverTooltip;

  return (
    <div>
      <div
        ref={refs.setReference}
        className={twMerge("w-fit", className)}
        onMouseEnter={() => setMouseIsOverChildren(true)}
        onMouseLeave={() => setTimeout(() => setMouseIsOverChildren(false), 100)}
      >
        {children}
      </div>

      {isOpen && (
        <div
          ref={refs.setFloating}
          className={twMerge(
            "z-10 w-4/5 px-4 py-2 max-w-screen-md rounded-md border border-foreground-6 bg-background text-sm",
            panelClassName
          )}
          style={floatingStyles}
          onMouseEnter={() => setMouseIsOverTooltip(true)}
          onMouseLeave={() => setMouseIsOverTooltip(false)}
        >
          {tooltipElement}
        </div>
      )}
    </div>
  );
};

export default TooltipOverChildren;
