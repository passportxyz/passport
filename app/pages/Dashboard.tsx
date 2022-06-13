/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// --Components
import { CardList } from "../components/CardList";
import { JsonOutputModal } from "../components/JsonOutputModal";

// --Chakra UI Elements
import { Spinner, useDisclosure, Alert, AlertTitle } from "@chakra-ui/react";

import { UserContext } from "../context/userContext";

import { useViewerConnection } from "@self.id/framework";

export default function Dashboard() {
  const { passport, wallet } = useContext(UserContext);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const navigate = useNavigate();

  const [viewerConnection] = useViewerConnection();

  // Route user to home when wallet is disconnected
  useEffect(() => {
    if (!wallet) {
      navigate("/");
    }
  }, [wallet]);

  return (
    <>
      <div className="flex w-full flex-col flex-wrap border-b-2 p-5 md:flex-row">
        <div className="float-right mb-4 flex items-center font-medium text-gray-900 md:mb-0">
          <img src="./assets/GitcoinLogo.svg" alt="Gitcoin Logo White" />
          <span className="font-miriam-libre ml-3 text-xl">Passport</span>
        </div>
      </div>

      <div className="mt-6 flex w-full flex-wrap px-10">
        <div className="w-3/4">
          <p className="mb-4 text-2xl text-black">Decentralized Identity Verification</p>
          <p className="text-xl text-black">Select the verification stamps you’d like to connect to your Passport.</p>
        </div>
        <div className="w-full md:w-1/4">
          {viewerConnection.status === "connecting" && (
            <Alert status="warning" data-testid="selfId-connection-alert">
              <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="orange.500" size="md" />
              <AlertTitle ml={4}> Waiting for wallet signature</AlertTitle>
            </Alert>
          )}
          {viewerConnection.status !== "connecting" &&
            (!passport ? (
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="purple.500"
                size="xl"
                data-testid="loading-spinner-passport"
              />
            ) : (
              <div>
                <button
                  data-testid="button-passport-json"
                  className="float-right rounded-md border-2 border-gray-300 py-2 px-6 text-black"
                  onClick={onOpen}
                >{`</> Passport JSON`}</button>

                <JsonOutputModal
                  isOpen={isOpen}
                  onClose={onClose}
                  title={"Passport JSON"}
                  subheading={"You can find the Passport JSON data below"}
                  jsonOutput={passport}
                />
              </div>
            ))}
        </div>
      </div>
      <CardList />
    </>
  );
}
