import { Modal, ModalCloseButton, ModalContent, ModalOverlay } from "@chakra-ui/react";

import { Step } from "../components/Progress";
import RefreshStampsProgressSteps from "./RefreshStampsProgressSteps";
import { RefreshMyStampsModalContent } from "./RefreshMyStampsModalContent";
import { ValidatedPlatform } from "../signer/utils";

export type RefreshMyStampsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  steps: Step[];
  validPlatforms: ValidatedPlatform[] | undefined;
  resetStampsAndProgressState: () => void;
  dashboardCustomizationKey: string | null;
};

export const RefreshMyStampsModal = ({
  isOpen,
  onClose,
  steps,
  validPlatforms,
  resetStampsAndProgressState,
  dashboardCustomizationKey,
}: RefreshMyStampsModalProps) => {
  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        closeOnOverlayClick={true}
        scrollBehavior="outside"
        datatest-id="refresh-my-stamps-modal"
      >
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent w="410px" minH="550px" maxH="auto">
          <ModalCloseButton />
          {validPlatforms ? (
            <>
              <RefreshMyStampsModalContent
                onClose={onClose}
                validPlatforms={validPlatforms}
                resetStampsAndProgressState={resetStampsAndProgressState}
                dashboardCustomizationKey={dashboardCustomizationKey}
              />
            </>
          ) : (
            <div className="p-4 md:p-6">
              <div className="font-heading text-3xl text-color-1">Searching for Stamps</div>
              <div className="mt-2 font-alt text-color-2">
                Give us a moment while we check your account for existing Stamps.
              </div>
              <RefreshStampsProgressSteps steps={steps} />
              <div className="text-center text-color-2">Please do not close the window.</div>
            </div>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
