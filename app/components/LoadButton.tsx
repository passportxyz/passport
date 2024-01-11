import React from "react";
import { Button, ButtonProps } from "./Button";
import { Spinner } from "@chakra-ui/react";

export type LoadingButtonProps = ButtonProps & {
  isLoading?: boolean;
};

export const LoadButton = ({ isLoading, disabled, children, ...props }: LoadingButtonProps) => {
  return (
    <Button {...props} disabled={disabled || isLoading}>
      {children}
      {isLoading && <Spinner size="sm" />}
    </Button>
  );
};
