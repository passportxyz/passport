import React, { ButtonHTMLAttributes, useMemo } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "custom";
};

// Children are centered and spaced out with gap-4.
// If your button just contains text, simply use the text
// e.g. <Button>Click me</Button>
// If your button has an icon or other elements, just include both elements
// e.g. <Button><Icon /><span>Click me</span></Button>
export const Button = ({ variant, className, ...props }: ButtonProps) => {
  const variantClassName = useMemo(() => {
    if (variant === "custom") {
      return "";
    } else if (variant === "secondary") {
      return "text-color-1 bg-background border border-foreground-3 rounded-s hover:border-foreground-4";
    } else {
      // primary, default
      return "text-color-4 rounded-s bg-gradient-to-r  from-foreground-2 to-foreground-2 hover:to-foreground-4";
    }
  }, [variant]);

  return (
    <button
      className={`group flex items-center justify-center gap-4 rounded-md px-5 py-2 font-alt text-base text-color-1
        disabled:cursor-not-allowed disabled:bg-foreground-3 disabled:brightness-75
        ${variantClassName} focus:border-transparent focus:outline focus:outline-1 focus:outline-focus ${className}`}
      {...props}
    />
  );
};
