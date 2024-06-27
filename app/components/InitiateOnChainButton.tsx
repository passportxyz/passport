/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useState } from "react";

// --- Style Components
import { OnchainSidebar } from "./OnchainSidebar";
import { Button } from "./Button";

const InitiateOnChainButton = ({
  className,
  variant = "primary",
  text = "Bring Passport onchain",
}: {
  className?: string;
  variant?: "primary" | "secondary" | "custom";
  text?: string;
}) => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);

  return (
    <>
      <Button className={`${className}`} variant={`${variant}`} onClick={() => setShowSidebar(true)}>
        {text}
      </Button>
      <OnchainSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
    </>
  );
};

export default InitiateOnChainButton;
