import React from "react";
import { Switch } from "@headlessui/react";
import { CheckIcon } from "@heroicons/react/24/outline";

type CheckboxProps = {
  onChange: (checked: boolean) => void;
  className?: string;
  isChecked?: boolean;
  disabled?: boolean;
  [key: string]: any;
};

const Checkbox = ({ className, isChecked, onChange, disabled, ...props }: CheckboxProps) => {
  return (
    <Switch
      checked={isChecked}
      onChange={onChange}
      className={`flex h-6 w-6 items-center justify-center rounded-md focus:border ${
        disabled ? "bg-accent-2" : "ui-checked:bg-accent ui-not-checked:border ui-not-checked:bg-background"
      } ${className}`}
      disabled={disabled}
      {...props}
    >
      <CheckIcon
        className={`invisible h-4 w-4 stroke-[3] text-color-1 ui-checked:visible ${disabled ? "text-color-4" : ""}`}
      />
    </Switch>
  );
};

export default Checkbox;
