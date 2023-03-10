import React, { createContext, useRef, useState } from "react";
import { PROVIDER_ID, Stamp } from "@gitcoin/passport-types";

import { useStampStorageReducer, Destination } from "./useStampStorageReducer";

type Initializer = () => Promise<Stamp[]>;
type Status = "UNINITIALIZED" | "WRITING" | "STEADY" | "ERROR";

export type OnAdd = (stamps: Stamp[]) => Promise<void>;
export type OnDelete = (providers: PROVIDER_ID[]) => Promise<void>;

export type Destination = {
  onAdd: OnAdd;
  onDelete: OnDelete;
};

const StampStorageContext = createContext({});

type OperationParams = {
  handleDispatch: () => void;
  handleDestinationWrite: (destination: Destination) => Promise<void>;
};

export const useStampStorage = () => {
  const [stamps, dispatch] = useStampStorageReducer();

  const [status, setStatus] = useState<Status>("UNINITIALIZED");
  const initializerRef = useRef<Initializer>();
  const pendingOperationCountRef = useRef<number>(0);
  const destinationsRef = useRef<Destination[]>([]);

  const addStamp = (stamp: Stamp) => addStamps([stamp]);
  const addStamps = (stamps: Stamp[]) =>
    _doOperation({
      handleDispatch: () => dispatch({ type: "add", stamps }),
      handleDestinationWrite: (destination) => destination.onAdd(stamps),
    });

  const deleteStamp = (provider: PROVIDER_ID) => deleteStamps([provider]);
  const deleteStamps = (providers: PROVIDER_ID[]) =>
    _doOperation({
      handleDispatch: () => dispatch({ type: "delete", providers }),
      handleDestinationWrite: (destination) => destination.onDelete(providers),
    });

  const _doOperation = ({ handleDispatch, handleDestinationWrite }: OperationParams) => {
    setStatus("WRITING");
    pendingOperationCountRef.current++;

    handleDispatch();

    (async () => {
      try {
        await Promise.all(
          destinationsRef.current.map((destination: Destination) => handleDestinationWrite(destination))
        );
        if (pendingOperationCountRef.current === 1) {
          setStatus("STEADY");
        }
      } catch (e) {
        // TODO probably store error to show to user
        console.error(e);
        setStatus("ERROR");
      } finally {
        pendingOperationCountRef.current--;
      }
    })();
  };

  const initialize = async (initializer: Initializer) => {
    initializerRef.current = initializer;
    await reload();
  };

  const reload = async () => {
    if (initializerRef.current) {
      const stamps = await initializerRef.current();
      dispatch({ type: "add", stamps });
    }
    setStatus("STEADY");
  };

  const registerDestination = (destination: Destination) => destinationsRef.current.push(destination);

  return {
    status,
    stamps,
    addStamp,
    addStamps,
    deleteStamp,
    deleteStamps,
    reload,
    initialize,
    registerDestination,
  };
};

export const StampStorageProvider = ({ children }: { children: React.ReactNode }) => {
  const stampStorage = useStampStorage();
  return <StampStorageContext.Provider value={stampStorage}>{children}</StampStorageContext.Provider>;
};
