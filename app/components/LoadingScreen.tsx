import React from "react";

const LoadingScreen = ({ className }: { className?: string }) => {
  return (
    <div className="flex h-full flex-col place-content-center">
      <img className={`h-80 ${className}`} src={"/assets/loadingSpinner.svg"} alt="Loading Spinner" />
    </div>
  );
};

export default LoadingScreen;
