import React, { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { PanelDiv } from "./PanelDiv";
import { Button } from "../Button";
import { LoadButton } from "../LoadButton";
import { BackdropEnabler } from "./Backdrop";

export const DataLine = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between py-2">
    <span className="text-color-6 text-xl font-bold">{label}</span>
    <span>{value}</span>
  </div>
);

export const StakeModal = ({
  title,
  buttonText,
  buttonSubtext,
  onButtonClick,
  buttonLoading,
  buttonDisabled,
  isOpen,
  onClose,
  children,
}: {
  title: string;
  buttonText: string;
  buttonSubtext?: string;
  onButtonClick: () => void;
  buttonLoading: boolean;
  buttonDisabled?: boolean;
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) => {
  return (
    <>
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-background/25" />
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
                <Dialog.Panel className="w-full max-w-lg overflow-hidden transition-all">
                  <BackdropEnabler />
                  <PanelDiv className="px-16 py-10 text-left text-color-1 align-middle">
                    <Dialog.Title className="text-3xl text-center font-medium leading-6 text-color-6 my-12">
                      {title}
                    </Dialog.Title>
                    <div className="mt-2">{children}</div>

                    <div className="mt-4 flex flex-col items-center">
                      <LoadButton
                        className="w-full"
                        onClick={onButtonClick}
                        isLoading={buttonLoading}
                        disabled={buttonDisabled}
                        subtext={buttonSubtext}
                      >
                        {buttonText}
                      </LoadButton>
                      <Button variant="custom" className="mt-4 px-8" onClick={onClose}>
                        Cancel
                      </Button>
                    </div>
                  </PanelDiv>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
};
