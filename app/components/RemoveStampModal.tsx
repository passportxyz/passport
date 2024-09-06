// --- React Methods
import React, { useState } from "react";

// --- Chakra Elements
import { PROVIDER_ID } from "@gitcoin/passport-types";

// --- Style Components
import { ActionOrCancelModal } from "./ActionOrCancelModal";
import { useMessage } from "../hooks/useMessage";

export type RemoveStampModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  body: string;
  stampsToBeDeleted?: PROVIDER_ID[];
  handleDeleteStamps: Function;
};

export const RemoveStampModal = ({
  isOpen,
  onClose,
  title,
  body,
  stampsToBeDeleted,
  handleDeleteStamps,
}: RemoveStampModalProps): JSX.Element => {
  const [isLoading, setIsLoading] = useState(false);
  const { success, failure } = useMessage();

  const handleStampRemoval = async () => {
    try {
      setIsLoading(true);
      await handleDeleteStamps(stampsToBeDeleted);
      success({
        title: "Success!",
        message: "Stamp data has been removed.",
      });
    } catch (error) {
      failure({
        title: "Error!",
        message: "Something went wrong. Please try again.",
      });
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  return (
    <ActionOrCancelModal
      title={title}
      buttonText={isLoading ? "Removing..." : "Remove Stamp"}
      onButtonClick={handleStampRemoval}
      isOpen={isOpen}
      onClose={onClose}
      buttonLoading={isLoading}
    >
      {body}
    </ActionOrCancelModal>
  );
};
