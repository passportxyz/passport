import React from "react";
import { Button, ButtonProps } from "./Button";

const SIWEButton = (props: ButtonProps) => {
  return (
    <Button {...props} className={(props.className || "") + " rounded-sm"}>
      <svg className="my-1" width="19" height="30" viewBox="0 0 19 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9.22009 22.4887V30.0001L18.4402 17.0493L9.22009 22.4887Z" fill="#2F3030" />
        <path d="M9.22009 11.1099V20.751L18.4402 15.2972L9.22009 11.1099Z" fill="black" />
        <path d="M9.22009 0V11.1098L18.4402 15.2971L9.22009 0Z" fill="#2F3030" />
        <path d="M9.22009 22.4887V30.0001L0 17.0493L9.22009 22.4887Z" fill="#828384" />
        <path d="M9.22009 11.1099V20.751L0 15.2972L9.22009 11.1099Z" fill="#343535" />
        <path d="M9.22009 0V11.1098L0 15.2971L9.22009 0Z" fill="#828384" />
      </svg>
      <span className="hidden group-disabled:inline">Loading...</span>
      <span className="inline group-disabled:hidden">Sign in with Ethereum</span>
    </Button>
  );
};

export default SIWEButton;
