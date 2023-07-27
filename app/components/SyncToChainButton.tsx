/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useCallback, useContext, useState } from "react";
import axios from "axios";
import { ethers, EthersError, isError, parseEther } from "ethers";

// --Chakra UI Elements
import { Spinner, useToast } from "@chakra-ui/react";
import { LinkIcon } from "@heroicons/react/20/solid";

import { CeramicContext } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";

import { VerifiableCredential, EasPayload } from "@gitcoin/passport-types";
import { OnChainContext } from "../context/onChainContext";

// --- Style Components
import { DoneToastContent } from "./DoneToastContent";
import { OnchainSidebar } from "./OnchainSidebar";

const SyncToChainButton = () => {
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

export default SyncToChainButton;
