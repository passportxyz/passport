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
};

export const RefreshMyStampsModal = ({
  isOpen,
  onClose,
  steps,
  validPlatforms,
  resetStampsAndProgressState,
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
        <ModalContent
          rounded="none"
          padding={5}
          w="410px"
          minH="550px"
          maxH="auto"
          backgroundColor="black"
          borderWidth="1px"
          borderColor="var(--color-accent-2)"
        >
          <ModalCloseButton color="var(--color-text-1)" />
          {validPlatforms ? (
            <>
              <RefreshMyStampsModalContent
                onClose={onClose}
                validPlatforms={validPlatforms}
                resetStampsAndProgressState={resetStampsAndProgressState}
              />
            </>
          ) : (
            <>
              <div className="font-heading text-3xl text-white">Searching for Stamps</div>
              <div className="mt-2 font-alt text-white">
                Give us a moment while we check your account for existing Stamps.
              </div>
              <RefreshStampsProgressSteps steps={steps} />
              <div className="text-center text-white">Please do not close the window.</div>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
};
