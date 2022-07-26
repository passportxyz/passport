// --- React Methods
import React, { useContext } from "react";

// --- Chakra UI Elements
import { Menu, MenuButton, MenuItem, MenuList, Spinner, useBoolean, useDisclosure } from "@chakra-ui/react";

// --- Types
import { VerifiableCredential } from "@gitcoin/passport-types";
import { ProviderSpec } from "../config/providers";

// --- Context
import { CeramicContext, IsLoadingPassportState } from "../context/ceramicContext";

// --- Components
import { JsonOutputModal } from "../components/JsonOutputModal";

export type CardProps = {
  providerSpec: ProviderSpec;
  verifiableCredential?: VerifiableCredential;
  icon?: string;
  issueCredentialWidget: JSX.Element;
  isLoading?: boolean;
  streamId?: string;
};

export const Card = ({
  providerSpec,
  verifiableCredential,
  issueCredentialWidget,
  isLoading = false,
  streamId,
}: CardProps): JSX.Element => {
  const { passport, isLoadingPassport, handleDeleteStamp } = useContext(CeramicContext);
  const { isOpen, onOpen: onOpenJsonOutputModal, onClose } = useDisclosure();
  const [isDeleting, setDeleting] = useBoolean();

  const onDeleteStamp = () => {
    if (streamId) {
      setDeleting.on();
      handleDeleteStamp(streamId);
      setTimeout(() => {}, 2000);
    }
  };

  return (
    <div className="w-1/2 p-2 md:w-1/2 xl:w-1/4">
      <div className="relative border border-gray-200 p-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex w-full flex-col items-center justify-center bg-white opacity-80">
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="purple.500"
              size="md"
              data-testid="loading-indicator"
            />
            Verifying stamp...
          </div>
        )}
        {isDeleting && (
          <div className="absolute inset-0 z-10 flex w-full flex-col items-center justify-center bg-white opacity-80">
            <Spinner
              thickness="4px"
              speed="0.65s"
              emptyColor="gray.200"
              color="purple.500"
              size="md"
              data-testid="loading-indicator"
            />
            Deleting stamp...
          </div>
        )}
        <div className="flex flex-row p-6">
          <div className="flex h-10 w-1/2 w-10 flex-grow">
            {providerSpec.icon ? (
              <img src={providerSpec.icon} alt={providerSpec.name} className="h-10 w-10" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M24.7999 24.8002H28.7999V28.8002H24.7999V24.8002ZM14 24.8002H18V28.8002H14V24.8002ZM3.19995 24.8002H7.19995V28.8002H3.19995V24.8002ZM24.7999 14.0002H28.7999V18.0002H24.7999V14.0002ZM14 14.0002H18V18.0002H14V14.0002ZM3.19995 14.0002H7.19995V18.0002H3.19995V14.0002ZM24.7999 3.2002H28.7999V7.2002H24.7999V3.2002ZM14 3.2002H18V7.2002H14V3.2002ZM3.19995 3.2002H7.19995V7.2002H3.19995V3.2002Z"
                  fill="#161616"
                />
              </svg>
            )}
          </div>

          {verifiableCredential ? (
            <>
              <Menu>
                <MenuButton px="2" border="1px" rounded="lg" borderColor="gray.200" data-testid="card-menu-button">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M10 6C8.89543 6 8 5.10457 8 4C8 2.89543 8.89543 2 10 2C11.1046 2 12 2.89543 12 4C12 5.10457 11.1046 6 10 6Z"
                      fill="#111827"
                    />
                    <path
                      d="M10 12C8.89543 12 8 11.1046 8 10C8 8.89543 8.89543 8 10 8C11.1046 8 12 8.89543 12 10C12 11.1046 11.1046 12 10 12Z"
                      fill="#111827"
                    />
                    <path
                      d="M10 18C8.89543 18 8 17.1046 8 16C8 14.8954 8.89543 14 10 14C11.1046 14 12 14.8954 12 16C12 17.1046 11.1046 18 10 18Z"
                      fill="#111827"
                    />
                  </svg>
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={onOpenJsonOutputModal} data-testid="view-json">
                    View Stamp JSON
                  </MenuItem>
                  <MenuItem onClick={onDeleteStamp} data-testid="remove-stamp">
                    Remove stamp
                  </MenuItem>
                </MenuList>
              </Menu>
              <JsonOutputModal
                isOpen={isOpen}
                onClose={onClose}
                title={`${providerSpec.name} JSON`}
                subheading={`You can find the ${providerSpec.name} JSON data below`}
                jsonOutput={verifiableCredential}
              />
            </>
          ) : (
            <></>
          )}
        </div>
        <div className="mt-2 p-2">
          <h1 className="title-font mb-3 text-lg font-medium text-gray-900">{providerSpec.name}</h1>
          <p className="pleading-relaxed hidden md:inline-block">{providerSpec.description}</p>
        </div>
        {/* TODO: change this to passport===false and introduce an offline save state when passport===undefined */}
        {!passport || isLoadingPassport !== IsLoadingPassportState.Idle ? (
          <span className="flex w-full items-center justify-center border-t-2 p-3 text-gray-900">
            <span>
              <Spinner
                title="loading..."
                size="sm"
                thickness="2px"
                speed="0.65s"
                emptyColor="gray.200"
                color="purple.500"
              />
            </span>
          </span>
        ) : verifiableCredential ? (
          <span className="flex w-full items-center justify-center border-t-2 p-3 text-gray-900">
            <img src="./assets/verifiedShield.svg" alt="Verified Shield" />
            <span className="ml-3 text-xl text-green-400">Verified</span>
          </span>
        ) : (
          issueCredentialWidget
        )}
      </div>
    </div>
  );
};
