import React, { createContext, useRef, useState } from "react";
import { Stamp } from "@gitcoin/passport-types";

import { useStampStorageReducer, Destination } from "./useStampStorageReducer";

type Initializer = () => Promise<Stamp[]>;
type Status = "UNINITIALIZED" | "WRITING" | "STEADY" | "ERROR";

const StampStorageContext = createContext({});

export const useStampStorage = () => {
  const [state, dispatch] = useStampStorageReducer();
  const [status, setStatus] = useState<Status>("UNINITIALIZED");
  const initializerRef = useRef<Initializer>();
  const pendingOperationCountRef = useRef<number>(0);
  const { stamps, destinations } = state;

  const addStamp = async (stamp: Stamp) => _doOperation("add", stamp);
  const deleteStamp = async (stamp: Stamp) => _doOperation("delete", stamp);

  const _doOperation = async (type: "add" | "delete", stamp: Stamp) => {
    pendingOperationCountRef.current++;

    dispatch({ type, stamp });

    (async () => {
      setStatus("WRITING");
      try {
        await Promise.all(
          destinations.map((destination: Destination) =>
            type === "delete" ? destination.onDelete(stamp) : destination.onAdd(stamp)
          )
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
  };

  const reload = async () => {
    if (initializerRef.current) {
      const stamps = await initializerRef.current();
      dispatch({ type: "initialize", stamps });
    }
    setStatus("STEADY");
  };

  const registerDestination = (destination: Destination) => {
    dispatch({ type: "registerDestination", destination });
  };

  return {
    status,
    stamps,
    addStamp,
    deleteStamp,
    reload,
    initialize,
    registerDestination,
  };
};

export const StampStorageProvider = ({ children }: { children: React.ReactNode }) => {
  const stampStorage = useStampStorage();
  return <StampStorageContext.Provider value={stampStorage}>{children}</StampStorageContext.Provider>;
};
