import { Modal, ModalContent, ModalOverlay } from "@chakra-ui/react";
import { useContext, useEffect, useState } from "react";

import { PlatformClass, providers } from "@gitcoin/passport-platforms";
import { PlatformGroupSpec, Platform, PROVIDER_ID, PLATFORM_ID } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { PlatformProps } from "../components/GenericPlatform";

import { Status, Step } from "../components/Progress";
import RefreshStampsProgressSteps from "./RefreshStampsProgressSteps";
import { PossibleEVMProvider } from "../signer/utils";
import { RefreshMyStampsModalContent } from "./RefreshMyStampsModalContent";

export type RefreshMyStampsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  steps: Step[];
  fetchedPossibleEVMStamps: PossibleEVMProvider[] | undefined;
};

// This modal looks for any web3 stamps the user has not yet claimed

export const RefreshMyStampsModal = ({
  isOpen,
  onClose,
  steps,
  fetchedPossibleEVMStamps,
}: RefreshMyStampsModalProps) => {
  const [isLoading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [platformsLoading, setPlatformsLoading] = useState(false);

  // TODO:
  // Render--if checking for evm stamps is in progress, show progress bar
  // if stamps are there/no stamps found, show RefreshStampsModalContent
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} closeOnOverlayClick={true} isCentered>
        <ModalOverlay />
        <ModalContent
          rounded={"none"}
          padding={5}
          w="410px"
          minH="550px"
          maxH="auto"
          backgroundColor="black"
          borderWidth="1px"
          borderColor="#234E52"
        >
          {fetchedPossibleEVMStamps ? (
            <>
              <RefreshMyStampsModalContent onClose={onClose} fetchedPossibleEVMStamps={fetchedPossibleEVMStamps} />
            </>
          ) : (
            <>
              <div className="text-3xl text-white">Searching for Stamps</div>
              <div className="mt-2 text-white">Give us a moment while we check your account for existing Stamps.</div>
              <RefreshStampsProgressSteps steps={steps} />
              <div className="text-center text-white">Please do not close the window.</div>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
