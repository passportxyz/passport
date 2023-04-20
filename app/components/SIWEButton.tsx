import React from "react";

const SIWEButton = ({
  className,
  login,
  testId,
  disabled,
}: {
  className?: string;
  login: () => void;
  testId?: string;
  disabled?: boolean;
}) => {
  return (
    <button
      data-testid={testId}
      className={`rounded bg-accent px-4 py-3 text-white disabled:cursor-not-allowed disabled:bg-muted disabled:text-black ${className}`}
      onClick={login}
      disabled={disabled}
    >
      <div className="flex items-center justify-center">
        <img
          src="/assets/ethLogo.svg"
          alt="Ethereum Logo"
          className={`mr-3 inline h-auto w-4 ${disabled ? "invert" : ""}`}
        />
        <span className="inline">{disabled ? "Loading..." : "Sign-in with Ethereum"}</span>
      </div>
    </button>
  );
};

export default SIWEButton;
