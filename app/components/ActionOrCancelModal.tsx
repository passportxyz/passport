import React from "react";
import { LoadButton } from "./LoadButton";
import { Button } from "./Button";
import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@chakra-ui/react";

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
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay width="100%" height="100%" />
      <ModalContent
        rounded={"8px"}
        padding={"28px"}
        paddingBottom={"12px"}
        maxW={"380px"}
        border={"rgb(var(--color-foreground-5)) 1px solid"}
        background={"linear-gradient(180deg, rgb(var(--color-background)) 0%, rgb(var(--color-foreground-5)) 100%)"}
      >
        <ModalHeader padding={0} fontWeight={"normal"} className="text-xl font-heading leading-tight text-focus my-4">
          {title}
        </ModalHeader>
        <ModalBody padding={0}>{children}</ModalBody>
        <ModalFooter padding={0} className="mt-8 flex font-medium flex-col items-center">
          <LoadButton className="w-full" onClick={onButtonClick} isLoading={buttonLoading} disabled={buttonDisabled}>
            {buttonText}
          </LoadButton>
          <Button variant="custom" className="mt-4 px-8" onClick={onClose}>
            Cancel
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
    // Headless UI version, doesn't work with Chakra modals
    // <>
    //   <Transition appear show={isOpen} as={Fragment}>
    //     <Dialog as="div" className="relative z-100" onClose={onClose}>
    //       <Transition.Child
    //         enter="ease-out duration-300"
    //         enterFrom="opacity-0"
    //         enterTo="opacity-100"
    //         leave="ease-in duration-200"
    //         leaveFrom="opacity-100"
    //         leaveTo="opacity-0"
    //       >
    //         <Backdrop />
    //       </Transition.Child>

    //       <div className="fixed inset-0 overflow-y-auto">
    //         <div className="flex min-h-full items-center justify-center p-4 text-center">
    //           <Transition.Child
    //             as={Fragment}
    //             enter="ease-out duration-300"
    //             enterFrom="opacity-0 scale-95"
    //             enterTo="opacity-100 scale-100"
    //             leave="ease-in duration-200"
    //             leaveFrom="opacity-100 scale-100"
    //             leaveTo="opacity-0 scale-95"
    //           >
    //             <Dialog.Panel className="w-full max-w-sm overflow-hidden transition-all">
    //               <div className="p-7 text-base text-left text-color-1 align-middle w-full rounded-lg border border-foreground-5 bg-gradient-to-b from-background to-foreground-5">
    //                 <Dialog.Title className="text-xl font-heading leading-tight text-focus my-4">{title}</Dialog.Title>
    //                 <div>{children}</div>

    //                 <div className="mt-4 flex font-medium flex-col items-center">
    //                   <LoadButton
    //                     className="w-full"
    //                     onClick={onButtonClick}
    //                     isLoading={buttonLoading}
    //                     disabled={buttonDisabled}
    //                   >
    //                     {buttonText}
    //                   </LoadButton>
    //                   <Button variant="custom" className="mt-4 px-8" onClick={onClose}>
    //                     Cancel
    //                   </Button>
    //                 </div>
    //               </div>
    //             </Dialog.Panel>
    //           </Transition.Child>
    //         </div>
    //       </div>
    //     </Dialog>
    //   </Transition>
    // </>
  );
};
