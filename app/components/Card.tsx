// --- React Methods
import React, { useContext } from "react";

// --- Chakra UI Elements
import { Spinner, useDisclosure } from "@chakra-ui/react";

// --- Types
import { VerifiableCredential } from "@gitcoin/passport-types";
import { ProviderSpec } from "../config/providers";

// --- Context
import { UserContext } from "../context/userContext";

// --- Components
import { JsonOutputModal } from "../components/JsonOutputModal";

export type CardProps = {
  providerSpec: ProviderSpec;
  verifiableCredential?: VerifiableCredential;
  icon?: string;
  issueCredentialWidget: JSX.Element;
  isLoading?: boolean;
};

export const Card = ({
  providerSpec,
  verifiableCredential,
  issueCredentialWidget,
  isLoading = false,
}: CardProps): JSX.Element => {
  const { passport, isLoadingPassport } = useContext(UserContext);
  const { isOpen, onOpen, onClose } = useDisclosure();
  return (
    <div className="w-full p-4 md:w-1/2 xl:w-1/4">
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
              <button className="rounded-lg border-2 md:w-1/4" onClick={onOpen}>{`</>`}</button>
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
          <p className="pleading-relaxed">{providerSpec.description}</p>
        </div>
        {/* TODO: change this to passport===false and introduce an offline save state when passport===undefined */}
        {!passport || isLoadingPassport ? (
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
