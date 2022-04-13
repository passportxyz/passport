// --- React Methods
import React, { useContext } from "react";

// --Components
import { CardList } from "../components/CardList";

// --Chakra UI Elements
import { Box, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from "@chakra-ui/react";

import { UserContext } from "../App";

export function Dashboard(): JSX.Element {
  const { handleConnection, address, walletLabel, passport, handleCreatePassport } = useContext(UserContext);

  return (
    <div className="mx-auto flex flex-wrap">
      <div className="w-full py-6 mb-6">
        <div className="font-miriam-libre text-gray-050 mt-10 font-normal font-bold leading-relaxed">
          {/* Top Avatar and Address */}
          <div className="flex items-center mx-auto sm:flex-row flex-col py-10">
            <div className="h-12 w-12 sm:mr-10 inline-flex items-center justify-center rounded-full bg-indigo-100 text-indigo-500 flex-shrink-0">
              <svg
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="sm:w-10 sm:h-10 w-2 h-2"
                viewBox="0 0 24 24"
              >
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div className="flex-grow sm:text-left text-center mt-6 sm:mt-0">
              <h2 className="text-gray-100 text-lg title-font font-medium mb-2">{address}</h2>
            </div>

            <div className="mb-10 mt-10 md:w-1/4">
              <button
                data-testid="connectWalletButton"
                className="bg-gray-100 text-violet-500 rounded-lg py-2 px-2 min-w-full"
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

        {address && (
          <div className="p-20 mt-2 mb-2">
            {!passport && (
              <button
                className="bg-gray-100 mb-10 min-w-full mt-10 px-20 py-4 rounded-lg text-violet-500"
                onClick={handleCreatePassport}
              >
                Create Passport
              </button>
            )}
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
        <div className="flex items-center mx-auto flex-col py-10">
          <h1 className="font-bold font-miriam-libre text-xl">Stamps</h1>
          <CardList />
        </div>
      </div>
    </div>
  );
}
