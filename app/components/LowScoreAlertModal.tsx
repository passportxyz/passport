/* eslint-disable react-hooks/exhaustive-deps */
import React from "react";
import { ActionOrCancelModal } from "../components/ActionOrCancelModal";

export const LowScoreAlertModal = ({
  isOpen,
  onProceed,
  onCancel,
}: {
  isOpen: boolean;
  onProceed: () => void;
  onCancel: () => void;
}) => (
  <ActionOrCancelModal
    title="Try building up a higher score?"
    buttonText="Proceed with mint"
    isOpen={isOpen}
    onButtonClick={onProceed}
    onClose={onCancel}
  >
    While some benefits might be available with a lower score, many partners require a score of 20 or higher.
    <br />
    <br />
    Do you still wish to proceed?
  </ActionOrCancelModal>
);
