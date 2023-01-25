import { useContext, useEffect, useState } from "react";
import { Button, Modal, ModalContent, ModalOverlay, useToast } from "@chakra-ui/react";
import { CeramicContext } from "../context/ceramicContext";
import { getPlatformSpec } from "../config/platforms";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { completedIcon } from "./Progress";

export type ExpiredStampModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const ExpiredStampModal = ({ isOpen, onClose }: ExpiredStampModalProps) => {
  const { expiredProviders, handleDeleteStamps } = useContext(CeramicContext);
  const toast = useToast();

  const expiredPlatformGroups = expiredProviders
    .filter((item, index) => {
      return expiredProviders.findIndex((i) => JSON.stringify(i) === JSON.stringify(item)) === index;
    })
    .map((provider: PROVIDER_ID) => getPlatformSpec(provider));

  const successToast = () => {
    toast({
      duration: 5000,
      isClosable: true,
      render: (result: any) => (
        <div className="flex justify-between rounded-md bg-blue-darkblue p-4 text-white">
          {completedIcon("./assets/purple-check-icon.svg")}
          <p className="py-1 px-3">Your Passport has been reset.</p>
          <button className="sticky top-0" onClick={result.onClose}>
            <img alt="close button" className="rounded-lg hover:bg-gray-500" src="./assets/x-icon.svg" />
          </button>
        </div>
      ),
    });
  };

  const deleteAndNotify = async () => {
    await handleDeleteStamps(expiredProviders);

    onClose();
    successToast();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} blockScrollOnMount={false}>
      <ModalOverlay />
      <ModalContent>
        <div className="m-3 flex flex-col items-center">
          <div className="mt-2 w-fit rounded-full bg-pink-500/25">
            <img className="m-2" alt="shield-exclamation-icon" src="./assets/shield-exclamation-icon-warning.svg" />
          </div>
          <p className="m-1 text-sm font-bold">Remove Expired Stamps</p>
          <p className="m-1 mb-4 text-center">
            These expired stamps will be removed from your Passport. You can still re-verify your stamp in the future.
          </p>
          <p className="w-full text-left text-sm font-semibold text-gray-600">Accounts</p>
          <hr className="border-1 w-full" />
          {expiredPlatformGroups.map((platform) => (
            <div key={platform?.name} className="flex w-full justify-start">
              <img width="25px" alt="Platform Image" src={platform?.icon} className="m-3" />
              <p className="pt-4 text-sm font-semibold">{platform?.name}</p>
            </div>
          ))}
          <div className="flex w-full">
            <button
              onClick={() => onClose()}
              className="sidebar-verify-btn border-1  mr-2 w-1/2 border bg-transparent text-gray-900 hover:bg-inherit"
            >
              Cancel
            </button>
            <button onClick={() => deleteAndNotify()} className="sidebar-verify-btn w-1/2">
              Remove
            </button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};
