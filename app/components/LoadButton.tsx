import React from "react";
import { Button, ButtonProps } from "./Button";
import { Spinner } from "./Spinner";

export type LoadingButtonProps = ButtonProps & {
  isLoading?: boolean;
};

export const LoadButton = ({ isLoading, disabled, children, ...props }: LoadingButtonProps) => {
  return (
    <Button {...props} disabled={disabled || isLoading}>
      {isLoading && <Spinner />}
      {children}
    </Button>
  );
};
