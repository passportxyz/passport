import React from "react";
import { Button } from "./Button";

const SIWEButton = (props: any) => {
  return (
    <Button {...props}>
      <svg width="12" height="20" fill="none" className="stroke-current">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="m10.997 9.633-4.998 1.982L1 9.633l4.999-7.966 4.998 7.966ZM11 12.687l-5.002 5.647L1 12.687l4.999 1.98L11 12.688Z"
        />
      </svg>
      <span className="hidden group-disabled:inline">Loading...</span>
      <span className="inline group-disabled:hidden">Sign-in with Ethereum</span>
    </Button>
  );
};

export default SIWEButton;
