import React from "react";
import { ActionOrCancelModal } from "../components/ActionOrCancelModal";

export const LowScoreAlertModal = ({
  isOpen,
  onProceed,
  onCancel,
  threshold,
}: {
  isOpen: boolean;
  onProceed: () => void;
  onCancel: () => void;
  threshold: number;
}) => (
  <ActionOrCancelModal
    title="Try building up a higher score?"
    buttonText="Proceed with mint"
    isOpen={isOpen}
    onButtonClick={onProceed}
    onClose={onCancel}
  >
    While some benefits might be available with a lower score, many partners require a score of {threshold} or higher.
    <br />
    <br />
    Do you still wish to proceed?
  </ActionOrCancelModal>
);
