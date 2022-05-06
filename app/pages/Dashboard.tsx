/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// --Components
import { CardList } from "../components/CardList";

// --Chakra UI Elements
import {
  Box,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Spinner,
} from "@chakra-ui/react";

import { UserContext } from "../context/userContext";

export default function Dashboard() {
  const navigate = useNavigate(),
    { handleConnection, address, walletLabel, passport, isLoadingPassport, handleCreatePassport, connectedWallets } =
      useContext(UserContext);

  // Route user to home when wallet is disconnected
  useEffect(() => {
    if (connectedWallets.length == 0) {
      navigate("/");
    }
  }, [connectedWallets.length]);

  useEffect(() => {
    if (!passport && !isLoadingPassport) {
      handleCreatePassport();
    }
  }, [passport, isLoadingPassport]);

  return (
    <div className="mx-auto flex flex-wrap">
      <div className="mb-6 w-full py-6">
        <div className="font-miriam-libre text-gray-050 mt-10 font-normal font-bold leading-relaxed">
          {/* Top Avatar and Address */}
          <div className="mx-auto flex flex-col items-center py-10 sm:flex-row">
            <div className="inline-flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-500 sm:mr-10">
              <svg
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-2 w-2 sm:h-10 sm:w-10"
                viewBox="0 0 24 24"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="mt-6 flex-grow text-center sm:mt-0 sm:text-left">
              <h2 className="title-font mb-2 text-lg font-medium text-gray-100">{address}</h2>
            </div>

            <div className="mb-10 mt-10 md:w-1/4">
              <button
                data-testid="connectWalletButton"
                className="min-w-full rounded-lg bg-gray-100 py-2 px-2 text-violet-500"
                onClick={handleConnection}
              >
                <p className="text-sm">{address ? `Disconnect from ${walletLabel || ""}` : "Get Started"}</p>
              </button>
            </div>
          </div>

          <p className="text-6xl">
            Gitcoin
            <br />
            ID Passport
          </p>
        </div>

        {!passport ? (
          <Spinner data-testid="loading-spinner" />
        ) : (
          <div className="mt-2 mb-2 p-20">
            <pre className="text-gray-100">
              <Accordion defaultIndex={[0]} allowMultiple>
                <AccordionItem>
                  <h2>
                    <AccordionButton borderColor={"white"}>
                      <Box flex="1" textAlign="left">
                        Your Passport
                      </Box>
                      <AccordionIcon />
                    </AccordionButton>
                  </h2>
                  <AccordionPanel pb={4}>{JSON.stringify(passport, undefined, 4)}</AccordionPanel>
                </AccordionItem>
              </Accordion>
            </pre>
          </div>
        )}

        {/* VCs */}
        <div className="mx-auto flex flex-col items-center py-10">
          <h1 className="font-miriam-libre text-xl font-bold">Stamps</h1>
          <CardList />
        </div>
      </div>
    </div>
  );
}
