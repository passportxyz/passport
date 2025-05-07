import React from "react";
import { Button } from "../components/Button";
import { useNavigateToPage } from "../hooks/useCustomization";

const Version = () => {
  const navigateToPage = useNavigateToPage();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-color-1">
      <div className="mb-4">
        <img src="/assets/passportLogoWhite.svg" alt="Passport Logo" />
      </div>
      <div className="text-xl mb-16">Git revision: {process.env.NEXT_PUBLIC_GIT_COMMIT_HASH}</div>{" "}
      <Button variant="secondary" onClick={() => navigateToPage("home")}>
        Back to Home
      </Button>
    </div>
  );
};

export default Version;
