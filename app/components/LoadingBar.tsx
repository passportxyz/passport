import React from "react";

import { twMerge } from "tailwind-merge";

export const LoadingBar = ({ className }: { className?: string }) => {
  return (
    <div
      className={twMerge(
        "h-10 w-full bg-size-400 animate-[loading-gradient_5s_ease-in-out_infinite] bg-gradient-to-r from-background via-foreground-5 to-background rounded-lg my-2",
        className
      )}
    />
  );
};

export type LoadingBarSectionProps = {
  isLoading: boolean;
  className?: string;
  loadingBarClassName?: string;
  children: React.ReactNode;
};

export const LoadingBarSection = ({ isLoading, className, loadingBarClassName, children }: LoadingBarSectionProps) => {
  return (
    <div className={twMerge("relative", className)}>
      <LoadingBar
        className={twMerge("absolute top-0 left-0", isLoading ? "visible" : "invisible", loadingBarClassName)}
      />
      <div className={isLoading ? "invisible" : "visible"}>{children}</div>
    </div>
  );
};
