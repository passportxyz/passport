import React, { useState, Ref } from "react";
import { Popover } from "@headlessui/react";
import { usePopper } from "react-popper";

const TextAlignedInfoIcon = ({ className }: { className?: string }): JSX.Element => (
  <div className={`relative top-[.125em] h-[1em] w-[1em] text-color-2 ${className}`}>
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 16 16" fill="currentColor">
      <path
        fill-rule="evenodd"
        d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z"
        clip-rule="evenodd"
      />
    </svg>
  </div>
);

const TooltipPopover = ({
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

  return (
    <Popover className={`group cursor-pointer px-2 ${className}`}>
      {/* ref type stuff is a workaround for the weird way popper needs references */}
      <Popover.Button as="div" ref={setReferenceElement as unknown as Ref<HTMLButtonElement>}>
        <TextAlignedInfoIcon className={iconClassName} />
      </Popover.Button>

      <Popover.Panel
        ref={setPopperElement as unknown as Ref<HTMLDivElement>}
        className={`invisible z-10 w-4/5 max-w-screen-md rounded-md border border-foreground-6 bg-background text-sm text-color-1 group-hover:visible ${panelClassName}`}
        style={styles.popper}
        {...attributes.popper}
        static
      >
        <div className="px-4 py-2">{children}</div>
      </Popover.Panel>
    </Popover>
  );
};

export default TooltipPopover;
