// --- React Methods
import React, { useContext, useState, useEffect } from "react";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";

// --- Identity tools
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- pull context
import { CeramicContext } from "../../context/ceramicContext";
import { UserContext } from "../../context/userContext";

// --- Platform definitions
import { getPlatformSpec } from "../../config/platforms";
import { STAMP_PROVIDERS } from "../../config/providers";

// --- Verification step tools
import QRCode from "react-qr-code";

// --- import components
import { SideBarContent } from "../SideBarContent";
import { DoneToastContent } from "../DoneToastContent";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
  useToast,
  Spinner,
} from "@chakra-ui/react";

// ---- Types
import {
  PROVIDER_ID,
  Stamp,
  VerifiableCredential,
  VerifiableCredentialRecord,
  PLATFORM_ID,
  CredentialResponseBody,
} from "@gitcoin/passport-types";

const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";

// Each provider is recognised by its ID
const platformId: PLATFORM_ID = "FractalId";

export default function FractalIdPlatform(): JSX.Element {
  const { address, signer } = useContext(UserContext);
  const { handleAddStamps, allProvidersState, userDid } = useContext(CeramicContext);
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);

  // find all providerIds
  const providerIds =
    STAMP_PROVIDERS["FractalId"]?.reduce((all, stamp) => {
      return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
    }, [] as PROVIDER_ID[]) || [];

  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [verifiedProviders, setVerifiedProviders] = useState<PROVIDER_ID[]>(
    providerIds.filter((providerId) => typeof allProvidersState[providerId]?.stamp?.credential !== "undefined")
  );
  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [selectedProviders, setSelectedProviders] = useState<PROVIDER_ID[]>([...verifiedProviders]);

  // any time we change selection state...
  useEffect(() => {
    if (selectedProviders.length !== verifiedProviders.length) {
      setCanSubmit(true);
    }
  }, [selectedProviders, verifiedProviders]);

  // --- Chakra functions
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  async function handleFetchFractalId(): Promise<void> {
    // TODO
  }

  return (
    <SideBarContent
      currentPlatform={getPlatformSpec(platformId)}
      currentProviders={STAMP_PROVIDERS[platformId]}
      verifiedProviders={verifiedProviders}
      selectedProviders={selectedProviders}
      setSelectedProviders={setSelectedProviders}
      isLoading={isLoading}
      verifyButton={
        <button
          disabled={!canSubmit}
          onClick={handleFetchFractalId}
          data-testid="button-verify-fractalid"
          className="sidebar-verify-btn"
        >
          Verify
        </button>
      }
    />
  );
}
