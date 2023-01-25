import { useContext, useEffect, useState } from "react";
import { Button, Modal, ModalContent, ModalOverlay, useToast } from "@chakra-ui/react";
import { CeramicContext } from "../context/ceramicContext";
import { getPlatformSpec } from "../config/platforms";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import { completedIcon } from "./Progress";
import { PLATFORMS, PlatformSpec } from "../config/platforms";
import { STAMP_PROVIDERS } from "../config/providers";

export type ExpiredStampModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const getProviderIdsFromPlatformId = (platformId: PLATFORM_ID): PROVIDER_ID[] => {
  return STAMP_PROVIDERS[platformId as PLATFORM_ID].flatMap((x) => x.providers.map((y) => y.name));
};

export const ExpiredStampModal = ({ isOpen, onClose }: ExpiredStampModalProps) => {
  const { expiredProviders, handleDeleteStamps } = useContext(CeramicContext);
  const toast = useToast();

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

  const expiredPlatforms = Object.keys(STAMP_PROVIDERS).filter((provider) => {
    const possibleProviders = getProviderIdsFromPlatformId(provider as PLATFORM_ID);
    return possibleProviders.filter((provider) => expiredProviders.includes(provider)).length > 0;
  });

  const deleteAndNotify = async () => {
    const stampsToDelete = expiredPlatforms.flatMap((platform) =>
      getProviderIdsFromPlatformId(platform as PLATFORM_ID)
    );
    await handleDeleteStamps(stampsToDelete);

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
          {expiredPlatforms.map((platform) => {
            const spec = getPlatformSpec(platform as PLATFORM_ID);
            return (
              <div key={spec?.name} className="w-full">
                <div className="flex w-full items-center justify-start">
                  <img width="25px" alt="Platform Image" src={spec?.icon} className="m-3" />
                  <p className="text-sm font-semibold">{spec?.name}</p>
                </div>
                <hr className="border-1 w-full" />
              </div>
            );
          })}
          <div className="flex w-full">
            <button
              onClick={() => onClose()}
              className="sidebar-verify-btn border-1  mr-2 w-1/2 border bg-transparent text-gray-900 hover:bg-inherit"
            >
              Cancel
            </button>
            <button
              data-testid="delete-duplicate"
              onClick={() => deleteAndNotify()}
              className="sidebar-verify-btn w-1/2"
            >
              Remove
            </button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};
