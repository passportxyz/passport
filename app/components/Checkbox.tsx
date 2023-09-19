import React from "react";
import { Switch } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";

type CheckboxProps = {
  onChange: (checked: boolean) => void;
  className?: string;
  checked?: boolean;
  disabled?: boolean;
  id?: string;
};

const Checkbox = ({ className, ...props }: CheckboxProps) => {
  return (
    <Switch
      className={`group flex h-6 w-6 items-center justify-center rounded-md
        focus:border disabled:bg-foreground-3 enabled:ui-checked:bg-foreground-6
        enabled:ui-not-checked:border enabled:ui-not-checked:bg-background
        ${className}`}
      {...props}
    >
      <CheckIcon className="invisible h-4 w-4 stroke-[3] text-color-1 group-disabled:text-color-4 ui-checked:visible" />
    </Switch>
  );
};

export default Checkbox;
