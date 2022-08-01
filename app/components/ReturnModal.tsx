// --- React Methods
import React, { useState, useContext, useEffect } from "react";

import { UserContext, UserArrivalSourceState } from "../context/userContext";

// --- Chakra Elements
import { Modal, ModalOverlay, ModalContent, Checkbox, ModalBody, ModalFooter, Button } from "@chakra-ui/react";

export type ReturnModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const ReturnModal = ({ isOpen, onClose }: ReturnModalProps): JSX.Element => {
  const [isChecked, setIsChecked] = useState(false);
  const { userArrivalSource } = useContext(UserContext);

  // Initial Modal CheckBox setting
  useEffect(() => {
    setIsChecked(localStorage.getItem("showReturnToTrustModalMessage") === "true");
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent data-testid="return-modal">
        <ModalBody>
          <div className="flex flex-col items-center p-4 text-center">
            <div className="mb-5 inline-flex items-center justify-center text-indigo-500">
              <img className="object-center" alt="shield-exclamation-icon" src="./assets/circle-check-icon.svg" />
            </div>
            <div className="flex-grow">
              <h2 className="title-font mb-3 text-lg font-medium text-gray-900">
                Don’t forget to submit your Passport!
              </h2>
              {userArrivalSource === UserArrivalSourceState.Known ? (
                <p className="text-base leading-relaxed">
                  When you add stamps to your Passport, you need to submit the updated Passport to an application (e.g.,
                  Gitcoin Grants).
                </p>
              ) : (
                <p className="text-base leading-relaxed">
                  You can verify your identity using the Gitcoin Passport across applications that integrate like
                  Gitcoin Grants.
                </p>
              )}
              <Checkbox
                mt={5}
                isChecked={isChecked}
                onChange={(e: any) => {
                  setIsChecked(e.target.checked);
                  if (e.target.checked) {
                    localStorage.setItem("showReturnToTrustModalMessage", "true");
                  } else {
                    localStorage.setItem("showReturnToTrustModalMessage", "");
                  }
                }}
              >
                Don’t show this message again.
              </Checkbox>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button width="50%" data-testid="submit-passport-become-partner" mr={2} variant="outline">
            <a href="https://forms.gle/ATkgtsVjKHmjY98h7" target="_blank" rel="noopener noreferrer">
              Become a partner
            </a>
          </Button>
          {userArrivalSource === UserArrivalSourceState.Known ? (
            <Button width="50%" data-testid="return-modal-return-button" colorScheme="purple" onClick={onClose}>
              <a href="https://gitcoin.co/trust">Return</a>
            </Button>
          ) : (
            <Button width="50%" data-testid="return-modal-done-button" colorScheme="purple" onClick={onClose}>
              Done
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};
