import React, { useCallback, useContext, useState } from "react";
import { JsonOutputModal } from "./JsonOutputModal";
import { CeramicContext } from "../context/ceramicContext";
import { Spinner } from "./Spinner";

const DownloadIcon = () => (
  <svg width="18" height="23" viewBox="0 0 18 23" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 1C10 0.447715 9.55228 0 9 0C8.44772 0 8 0.447715 8 1H10ZM8.29289 15.7071C8.68342 16.0976 9.31658 16.0976 9.70711 15.7071L16.0711 9.34315C16.4616 8.95262 16.4616 8.31946 16.0711 7.92893C15.6805 7.53841 15.0474 7.53841 14.6569 7.92893L9 13.5858L3.34315 7.92893C2.95262 7.53841 2.31946 7.53841 1.92893 7.92893C1.53841 8.31946 1.53841 8.95262 1.92893 9.34315L8.29289 15.7071ZM8 1V15H10V1H8Z"
      fill="rgb(var(--color-foreground-2))"
    />
    <path d="M1 21.5H17" stroke="rgb(var(--color-foreground-2))" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const PassportDetailsButton = ({ className }: { className?: string }) => {
  const { passport } = useContext(CeramicContext);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const onOpen = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const onClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const ready = Boolean(passport);

  return (
    <>
      <button
        className={`font-alt text-right flex items-center text-color-6 disabled:cursor-not-allowed ${className}`}
        disabled={!ready}
        onClick={onOpen}
        data-testid="button-passport-json"
      >
        <span className="mr-1">Passport Details</span>
        {ready ? <DownloadIcon /> : <Spinner color="rgb(var(--color-text-6))" />}
      </button>
      <JsonOutputModal
        isOpen={isModalOpen}
        onClose={onClose}
        title={"Passport JSON"}
        subheading={"You can find the Passport JSON data below"}
        jsonOutput={passport}
      />
    </>
  );
};
