// --- React Methods
import React from "react";

// --- Chakra Elements
import { Modal, ModalOverlay, ModalContent } from "@chakra-ui/react";

import { Stamp } from "@gitcoin/passport-types";

export type NoStampModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const NoStampModal = ({ isOpen, onClose }: NoStampModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <div className="m-3 flex flex-col items-center">
          <div className="mt-2 w-fit rounded-full bg-pink-500/25">
            <img className="m-2" alt="shield-exclamation-icon" src="./assets/shield-exclamation-icon-warning.svg" />
          </div>
          <p className="m-1 text-sm font-bold">No Stamp Found</p>
          <p className="m-1 mb-4 text-center">
            The stamp you are trying to verify could not be associated with your current Ethereum wallet address.
          </p>
          <div className="flex w-full">
            <a href="" target="_blank" className="m-1 w-1/2 items-center rounded-md border py-2  text-center">
              Go to ENS
            </a>
            <button className="m-1 w-1/2 rounded-md bg-purple-connectPurple py-2 text-white hover:bg-purple-200 hover:text-black">
              Try another wallet
            </button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};
