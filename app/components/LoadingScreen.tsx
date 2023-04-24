import React from "react";

const LoadingScreen = () => {
  return (
    <div className="flex h-1/2 flex-col place-content-center text-center text-3xl text-color-2">
      Loading...
      <img className="mt-2 h-12 animate-bounce" src={"/assets/passportLogoWhite.svg"} alt="Gitcoin Logo" />
    </div>
  );
};

export default LoadingScreen;
