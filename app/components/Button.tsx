import React, { ButtonHTMLAttributes, useMemo } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

const Button = ({ variant, className, ...props }: ButtonProps) => {
  const variantClassName = useMemo(() => {
    if (variant === "secondary") return "bg-background border border-accent-2 hover:bg-accent-2";
    else return "bg-accent hover:bg-muted enabled:hover:text-accent";
  }, [variant]);

  return (
    <button
      className={`group flex items-center justify-center gap-4 rounded-md px-5 py-2 text-color-1
        disabled:cursor-not-allowed disabled:bg-accent-2 disabled:brightness-75
        ${variantClassName} ${className}`}
      {...props}
    />
  );
};

export default Button;
