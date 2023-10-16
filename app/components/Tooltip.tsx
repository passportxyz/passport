import React, { useState, Ref } from "react";
import { Popover } from "@headlessui/react";
import { InformationCircleIcon } from "@heroicons/react/24/solid";
import { usePopper } from "react-popper";

const TextAlignedInfoIcon = ({ className }: { className?: string }): JSX.Element => (
  <InformationCircleIcon className={`relative top-[.125em] h-[1em] w-[1em] text-color-2 ${className}`} />
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
