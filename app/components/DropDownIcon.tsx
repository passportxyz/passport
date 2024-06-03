import React from "react";

export const DropDownIcon = ({
  isOpen,
  className,
  width,
  height,
}: {
  isOpen: boolean;
  className?: string;
  width?: string;
  height?: string;
}) => (
  <div className={className}>
    <svg
      width="17"
      height="10"
      viewBox="0 0 17 10"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`transition-transform ${isOpen ? "" : "-rotate-180"}`}
    >
      <path
        d="M0.294358 8.29289C-0.0961666 8.68342 -0.0961666 9.31658 0.294358 9.70711C0.684882 10.0976 1.31805 10.0976 1.70857 9.70711L0.294358 8.29289ZM8.31519 1.68628L9.02229 0.979172L8.31519 0.272065L7.60808 0.979172L8.31519 1.68628ZM14.9218 9.70711C15.3123 10.0976 15.9455 10.0976 16.336 9.70711C16.7265 9.31658 16.7265 8.68342 16.336 8.29289L14.9218 9.70711ZM1.70857 9.70711L9.02229 2.39339L7.60808 0.979172L0.294358 8.29289L1.70857 9.70711ZM7.60808 2.39339L14.9218 9.70711L16.336 8.29289L9.02229 0.979172L7.60808 2.39339Z"
        fill="#C1F6FF"
      />
    </svg>
  </div>
);
