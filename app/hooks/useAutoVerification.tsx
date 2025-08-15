import { useContext, useEffect, useRef } from "react";
import { useAccount } from "wagmi";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { CeramicContext } from "../context/ceramicContext";
import { useOneClickVerification } from "./useOneClickVerification";
import { datadogLogs } from "@datadog/browser-logs";

export const useAutoVerification = () => {
  const { address } = useAccount();
  const { dbAccessTokenStatus, did } = useDatastoreConnectionContext();
  const { databaseReady } = useContext(CeramicContext);
  const { initiateVerification } = useOneClickVerification();

  // Track if verification has been initiated to prevent duplicate runs
  const verificationInitiatedRef = useRef<boolean>(false);

  useEffect(() => {
    // Check if login is complete (wallet connected + database connected)
    const isLoginComplete = address && dbAccessTokenStatus === "connected" && did && databaseReady;

    // Reset when user disconnects
    if (!isLoginComplete) {
      verificationInitiatedRef.current = false;
      return;
    }

    // Trigger verification if login is complete and verification hasn't been initiated
    if (!verificationInitiatedRef.current) {
      verificationInitiatedRef.current = true;

      datadogLogs.logger.info("Initiating automatic stamp verification", { address });

      initiateVerification(did, address)
        .then(() => {
          datadogLogs.logger.info("Auto verification completed successfully", { address });
        })
        .catch((error) => {
          console.error("Auto verification failed:", error);
          datadogLogs.logger.error("Auto verification failed", {
            address,
            error: error.message,
          });
          // Reset the flag so verification can be retried
          verificationInitiatedRef.current = false;
        });
    }
  }, [address, dbAccessTokenStatus, did, databaseReady, initiateVerification]);

  return {
    isAutoVerificationReady: !verificationInitiatedRef.current,
    hasAutoVerificationStarted: verificationInitiatedRef.current,
  };
};
