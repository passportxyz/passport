import React, { useContext } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { ActionOrCancelModal } from "./ActionOrCancelModal";

type RemovePlatformModalProps = {
  isOpen: boolean;
  onClose: () => void;
  providerIds: PROVIDER_ID[];
  platformName: string;
  onComplete?: () => void;
};

export const RemovePlatformModal = ({
  isOpen,
  onClose,
  providerIds,
  platformName,
  onComplete,
}: RemovePlatformModalProps) => {
  const { handleDeleteStamps } = useContext(CeramicContext);

  const handleRemove = async () => {
    if (providerIds.length > 0) {
      await handleDeleteStamps(providerIds);
      onClose();
      onComplete?.();
    }
  };

  return (
    <ActionOrCancelModal
      title="Remove Credentials"
      isOpen={isOpen}
      onClose={onClose}
      onButtonClick={handleRemove}
      buttonText="Remove All"
    >
      <p className="text-color-4">
        Are you sure you want to remove all credentials from{" "}
        <span className="font-semibold text-color-2">{platformName}</span>? This will remove {providerIds.length}{" "}
        credential
        {providerIds.length !== 1 ? "s" : ""} and cannot be undone.
      </p>
    </ActionOrCancelModal>
  );
};
