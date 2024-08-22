import React, { Fragment, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Backdrop } from "./Backdrop";
import { LoadButton } from "./LoadButton";
import { Button } from "./Button";
import { useChakraPortalWorkaround } from "../hooks/useChakraPortalWorkaround";

// Modal with an action button and a cancel button
// Pass the body content as children
export const ActionOrCancelModal = ({
  title,
  buttonText,
  onButtonClick,
  buttonLoading,
  buttonDisabled,
  isOpen,
  onClose,
  children,
}: {
  title: React.ReactNode;
  buttonText: string;
  onButtonClick: () => void;
  isOpen: boolean;
  onClose: () => void;
  buttonLoading?: boolean;
  buttonDisabled?: boolean;
  children: React.ReactNode;
}) => {
  useChakraPortalWorkaround();

  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-100" onClose={onClose}>
          <Transition.Child
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Backdrop />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-sm overflow-hidden transition-all">
                  <div className="p-7 text-base text-left text-color-1 align-middle w-full rounded-lg border border-foreground-5 bg-gradient-to-b from-background to-foreground-5">
                    <Dialog.Title className="text-xl font-heading leading-tight text-focus my-4">{title}</Dialog.Title>
                    <div>{children}</div>

                    <div className="mt-4 flex font-medium flex-col items-center">
                      <LoadButton
                        className="w-full"
                        onClick={onButtonClick}
                        isLoading={buttonLoading}
                        disabled={buttonDisabled}
                      >
                        {buttonText}
                      </LoadButton>
                      <Button variant="custom" className="mt-4 px-8" onClick={onClose}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
