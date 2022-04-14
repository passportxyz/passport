// --- React Methods
import React, { useContext } from "react";

import { Box, Accordion, AccordionItem, AccordionButton, AccordionPanel, AccordionIcon } from "@chakra-ui/react";

import { vcData } from "../types";

type CardProps = {
  vcdata: vcData;
};

export const Card = ({ vcdata }: CardProps): JSX.Element => {
  return (
    <div className="flex relative m-2">
      <div className="px-2 py-4 relative z-10 w-full border-4 border-gray-200 bg-white rounded-lg">
        <div className="flex items-center mb-3 justify-space-between">
          <div className="w-8 h-8 inline-flex items-center justify-center text-white flex-shrink-0">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M24.7999 24.8002H28.7999V28.8002H24.7999V24.8002ZM14 24.8002H18V28.8002H14V24.8002ZM3.19995 24.8002H7.19995V28.8002H3.19995V24.8002ZM24.7999 14.0002H28.7999V18.0002H24.7999V14.0002ZM14 14.0002H18V18.0002H14V14.0002ZM3.19995 14.0002H7.19995V18.0002H3.19995V14.0002ZM24.7999 3.2002H28.7999V7.2002H24.7999V3.2002ZM14 3.2002H18V7.2002H14V3.2002ZM3.19995 3.2002H7.19995V7.2002H3.19995V3.2002Z"
                fill="#161616"
              />
            </svg>
          </div>
          {vcdata.isVerified ? <p>✅ Verified</p> : vcdata.verificationButton}
        </div>
        <h1 className="title-font text-lg font-medium text-gray-900 mb-3">{vcdata.name}</h1>
        <p className="leading-relaxed">{vcdata.description}</p>
        <Accordion defaultIndex={[0]} allowMultiple backgroundColor={"white"}>
          <AccordionItem>
            <h2>
              <AccordionButton>
                <Box flex="1" textAlign="left">
                  Output
                </Box>
                <AccordionIcon />
              </AccordionButton>
            </h2>
            <AccordionPanel pb={4}>{vcdata.output}</AccordionPanel>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
};
