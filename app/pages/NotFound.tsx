import React from "react";
import { Button } from "../components/Button";
import { useNavigateToPage } from "../hooks/useCustomization";

export const NotFound = () => {
  const navigateToPage = useNavigateToPage();
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-color-1">
      <div className="mb-4">
        <img src="/assets/passportLogoWhite.svg" alt="Passport Logo" />
      </div>
      <div className="text-4xl font-bold font-alt mb-2">404</div>
      <div className="text-xl mb-16">Oops! Page not found.</div>
      <Button variant="secondary" onClick={() => navigateToPage("home")}>
        Go Home
      </Button>
    </div>
  );
};
