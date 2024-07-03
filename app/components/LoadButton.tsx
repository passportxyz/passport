import React from "react";
import { Button, ButtonProps } from "./Button";
import { Spinner } from "./Spinner";

export type LoadingButtonProps = ButtonProps & {
  isLoading?: boolean;
  loadIconPosition?: "left" | "right";
};

export const LoadButton = ({ isLoading, disabled, children, loadIconPosition, ...props }: LoadingButtonProps) => {
  return (
    <Button {...props} disabled={disabled || isLoading}>
      {isLoading && loadIconPosition !== "right" && <Spinner />}
      {children}
      {isLoading && loadIconPosition === "right" && <Spinner />}
    </Button>
  );
};
