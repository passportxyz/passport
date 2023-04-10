import { Popover } from "@headlessui/react";
import { InformationCircleIcon } from "@heroicons/react/24/solid";

const TooltipPopover = ({ children }: { children: React.ReactNode }) => {
  return (
    <Popover className="group relative">
      <Popover.Button>
        <InformationCircleIcon height={36} width="auto" className="translate-y-[5px] p-2 text-accent-3" />
      </Popover.Button>

      <Popover.Panel static className="absolute left-6 top-6 z-10 hidden w-64 group-hover:block">
        <div className="rounded-lg bg-background p-4 shadow-lg">{children}</div>
      </Popover.Panel>
    </Popover>
  );
};

export default TooltipPopover;
