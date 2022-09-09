// --- React Methods
import React, { useContext } from "react";

// --- Chakra Elements
import { Modal, ModalOverlay, ModalContent } from "@chakra-ui/react";

import { Stamp } from "@gitcoin/passport-types";
import { UserContext } from "../context/userContext";
import { useConnectWallet } from "@web3-onboard/react";

export type NoStampModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const initiateAccountChange = async (): Promise<void> => {
  await window.ethereum.request({
    method: "wallet_requestPermissions",
    params: [
      {
        eth_accounts: {},
      },
    ],
  });
};

export const NoStampModal = ({ isOpen, onClose }: NoStampModalProps) => {
  // const { wallet, handleConnection } = useContext(UserContext);
  // // const initiateAccountChange = async (): Promise<void> => {
  // //   onClose();
  // //   const wallets = await handleConnection();
  // // };
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
            <button
              data-testid="check-other-wallet"
              className="m-1 w-1/2 rounded-md bg-purple-connectPurple py-2 text-white hover:bg-purple-200 hover:text-black"
              onClick={initiateAccountChange}
            >
              Try another wallet
            </button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};
