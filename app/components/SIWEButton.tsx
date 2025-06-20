import React from "react";
import { LoadButton, LoadingButtonProps } from "./LoadButton";

const SIWEButton = (props: LoadingButtonProps & { enableEthBranding: boolean; subtext?: string }) => {
  const { enableEthBranding, isLoading, subtext, ...rest } = props;
  return (
    <LoadButton {...rest} className={(props.className || "") + " rounded-md"}>
      {/* {enableEthBranding && !isLoading && (
        <svg className="my-1" width="19" height="30" viewBox="0 0 19 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9.22009 22.4887V30.0001L18.4402 17.0493L9.22009 22.4887Z" fill="#2F3030" />
          <path d="M9.22009 11.1099V20.751L18.4402 15.2972L9.22009 11.1099Z" fill="black" />
          <path d="M9.22009 0V11.1098L18.4402 15.2971L9.22009 0Z" fill="#2F3030" />
          <path d="M9.22009 22.4887V30.0001L0 17.0493L9.22009 22.4887Z" fill="#828384" />
          <path d="M9.22009 11.1099V20.751L0 15.2972L9.22009 11.1099Z" fill="#343535" />
          <path d="M9.22009 0V11.1098L0 15.2971L9.22009 0Z" fill="#828384" />
        </svg>
      )}
      <div className="flex flex-col items-center">
        <span className="hidden group-disabled:inline">Logging in...</span>
        <span className="inline group-disabled:hidden">
          Sign in {enableEthBranding ? "with Ethereum" : "using signature"}
        </span>
        <div className={`text-xs ${subtext ? "block" : "hidden"}`}>({subtext})</div>
      </div> */}
      {!isLoading && (
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M22.6667 18.6667H22.68M9.33333 9.33333H25.3333C26.0406 9.33333 26.7189 9.61428 27.219 10.1144C27.719 10.6145 28 11.2928 28 12V25.3333C28 26.0406 27.719 26.7189 27.219 27.219C26.7189 27.719 26.0406 28 25.3333 28H6.66667C5.95942 28 5.28115 27.719 4.78105 27.219C4.28095 26.7189 4 26.0406 4 25.3333V6.66667C4 5.95942 4.28095 5.28115 4.78105 4.78105C5.28115 4.28095 5.95942 4 6.66667 4H25.3333"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      <div className="flex flex-col items-center">
        <span className="hidden group-disabled:inline">Logging in...</span>
        <span className="inline group-disabled:hidden">Connect your wallet</span>
        <div className={`text-xs ${subtext ? "block" : "hidden"}`}>({subtext})</div>
      </div>
    </LoadButton>
  );
};

export default SIWEButton;
