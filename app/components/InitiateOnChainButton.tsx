/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useState } from "react";

// --Chakra UI Elements
import { LinkIcon } from "@heroicons/react/20/solid";

// --- Style Components
import { OnchainSidebar } from "./OnchainSidebar";

const InitiateOnChainButton = () => {
  const [showSidebar, setShowSidebar] = useState<boolean>(false);

  return (
    <>
      <button className="h-10 w-10 rounded-md border border-muted" onClick={() => setShowSidebar(true)}>
        <div className="flex justify-center">
          <LinkIcon width="24" />
        </div>
      </button>
      <OnchainSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />
    </>
  );
};

export default InitiateOnChainButton;
