/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useState } from "react";

// --- Style Components
import { OnchainSidebar } from "./OnchainSidebar";
import { Button } from "./Button";

const InitiateOnChainButton = ({ className }: { className?: string }) => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);

  return (
    <>
      <Button className={`${className}`} onClick={() => setShowSidebar(true)}>
        Bring Passport onchain
      </Button>
      <OnchainSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
    </>
  );
};

export default InitiateOnChainButton;
