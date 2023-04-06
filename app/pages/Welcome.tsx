/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

// --Components
import { CardList } from "../components/CardList";
import MinimalHeader from "../components/MinimalHeader";
import PageWidthGrid, { PAGE_PADDING } from "../components/PageWidthGrid";
import HeaderContentFooterGrid from "../components/HeaderContentFooterGrid";
import { WelcomeBack } from "../components/WelcomeBack";

// --Chakra UI Elements
import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalOverlay,
  Spinner,
  useDisclosure,
} from "@chakra-ui/react";

import { CeramicContext, IsLoadingPassportState } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";

import { useViewerConnection } from "@self.id/framework";
import { EthereumAuthProvider } from "@self.id/web";
import { RefreshMyStampsModal } from "../components/RefreshMyStampsModal";
import { ExpiredStampModal } from "../components/ExpiredStampModal";
import ProcessingPopup from "../components/ProcessingPopup";
import { getFilterName } from "../config/filters";

export default function Welcome() {
  const [skipForNow, setSkipForNow] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const navigate = useNavigate();

  // Route user to dashboard when wallet is connected
  useEffect(() => {
    if (skipForNow) {
      navigate("/dashboard");
    }
  }, [skipForNow]);

  return (
    <div className="bg-background text-color-2 tall:max-h-screen tall:overflow-hidden">
      <HeaderContentFooterGrid>
        <div className={PAGE_PADDING}>
          <MinimalHeader className={`border-b border-accent-2`} />
        </div>
        <PageWidthGrid>
          <div className="col-span-4 flex flex-col items-center text-center md:col-start-2 lg:col-start-3 xl:col-span-6 xl:col-start-4">
            {/* if connected wallet address has a passport, show the Welcome Back component */}
            <WelcomeBack setSkipForNow={setSkipForNow} onOpen={onOpen} />

            {/* otherwise, show the First Time Welcome component */}
          </div>
        </PageWidthGrid>
      </HeaderContentFooterGrid>
      <RefreshMyStampsModal isOpen={isOpen} onClose={onClose} />
    </div>
  );
}
