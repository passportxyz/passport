/* eslint-disable react-hooks/exhaustive-deps */
// --- React Methods
import React, { useCallback, useContext, useState } from "react";
import axios from "axios";
import { ethers, EthersError, isError, parseEther } from "ethers";

// --Chakra UI Elements
import { Spinner, useToast } from "@chakra-ui/react";

import GitcoinVerifier from "../contracts/GitcoinVerifier.json";

import { CeramicContext } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";

import { VerifiableCredential, EasPayload } from "@gitcoin/passport-types";

export type ErrorDetailsProps = {
  msg: string;
  ethersError: EthersError;
};

const ErrorDetails = ({ msg, ethersError }: ErrorDetailsProps): JSX.Element => {
  const [displayDetails, setDisplayDetails] = useState<string>("none");
  const [textLabelDisplay, setTextLabelDisplay] = useState<string>("Show details");

  const copyDetailsToClipboard = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigator.clipboard.writeText(ethersError.message);
  };

  const toggleDetails = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (displayDetails === "none") {
      setDisplayDetails("block");
      setTextLabelDisplay("Hide details");
    } else {
      setDisplayDetails("none");
      setTextLabelDisplay("Show details");
    }
  };
  return (
    <div>
      <p>{msg}</p>
      <br></br>
      Please{" "}
      <b>
        <a href="#" onClick={copyDetailsToClipboard}>
          copy transaction details{" "}
        </a>
      </b>{" "}
      in case you contact our support.{" "}
      <a href="#" onClick={toggleDetails}>
        {textLabelDisplay}
      </a>
      .<p style={{ display: displayDetails }}>{ethersError.message}</p>
    </div>
  );
};

const SyncToChainButton = () => {
  const { passport } = useContext(CeramicContext);
  const { wallet, address } = useContext(UserContext);
  const [syncingToChain, setSyncingToChain] = useState(false);
  const toast = useToast();

  const onSyncToChain = useCallback(async (wallet, passport) => {
    if (passport && wallet) {
      try {
        setSyncingToChain(true);
        const credentials = passport.stamps.map(({ credential }: { credential: VerifiableCredential }) => credential);
        const ethersProvider = new ethers.BrowserProvider(wallet.provider, "any");
        const gitcoinAttesterContract = new ethers.Contract(
          process.env.NEXT_PUBLIC_GITCOIN_VERIFIER_CONTRACT_ADDRESS as string,
          GitcoinVerifier.abi,
          await ethersProvider.getSigner()
        );

        if (credentials.length === 0) {
          // Nothing to be broough on-chain
          toast({
            title: "Error",
            description: "You do not have any stamps to bring on-chain.",
            status: "warning",
            duration: 9000,
            isClosable: true,
          });
          return;
        }

        const nonce = await gitcoinAttesterContract.recipientNonces(address);
        const { data }: { data: EasPayload } = await axios({
          method: "post",
          url: `${process.env.NEXT_PUBLIC_PASSPORT_IAM_URL}v0.0.0/eas`,
          data: {
            credentials,
            nonce,
          },
          headers: {
            "Content-Type": "application/json",
          },
          transformRequest: [(data) => JSON.stringify(data, (k, v) => (typeof v === "bigint" ? v.toString() : v))],
        });

        if (data.error) {
          console.error(
            "error syncing credentials to chain: ",
            data.error,
            "credentials: ",
            credentials,
            "nonce:",
            nonce
          );
        }
        if (data.invalidCredentials.length > 0) {
          console.log("not syncing invalid credentials (invalid credentials): ", data.invalidCredentials);
        }

        if (data.passport) {
          const { v, r, s } = data.signature;

          const transaction = await gitcoinAttesterContract.addPassportWithSignature(
            process.env.NEXT_PUBLIC_GITCOIN_VC_SCHEMA_UUID as string,
            data.passport,
            v,
            r,
            s,
            { value: data.passport.fee }
          );
          toast({
            title: "Submitted",
            description: "Passport submitted to chain",
            status: "info",
            duration: 5000,
            isClosable: true,
          });
          await transaction.wait();
          const easScannURL = `${process.env.NEXT_PUBLIC_EAS_EXPLORER}/address/${wallet.address}`;
          toast({
            title: "Success",
            description: (
              <p>
                Passport successfully synced to chain.{" "}
                <a href="https://sepolia.easscan.org/address/0x85fF01cfF157199527528788ec4eA6336615C989">
                  Check your stamps
                </a>
              </p>
            ),
            status: "success",
            duration: 9000,
            isClosable: true,
          });
        }
      } catch (e) {
        console.error("error syncing credentials to chain: ", e);
        let toastDescription: string | JSX.Element =
          "An unexpected error occured while trying to bring the data on-chain.";
        debugger;
        if (isError(e, "ACTION_REJECTED")) {
          toastDescription = "Transaction rejected by user";
        } else if (isError(e, "INSUFFICIENT_FUNDS")) {
          toastDescription =
            "You don't have sufficient funds to bring your stamps on-chain. Consider funding your wallet first.";
        } else if (isError(e, "CALL_EXCEPTION")) {
          toastDescription = <ErrorDetails msg={"Error writing stamps to chain: " + e.reason} ethersError={e} />;
        } else if (
          isError(e, "NONCE_EXPIRED") ||
          isError(e, "REPLACEMENT_UNDERPRICED") ||
          isError(e, "TRANSACTION_REPLACED") ||
          isError(e, "UNCONFIGURED_NAME") ||
          isError(e, "OFFCHAIN_FAULT")
        ) {
          toastDescription = (
            <ErrorDetails
              msg={"A Blockchain error occured while executing this transaction. Please try again in a few minutes."}
              ethersError={e}
            />
          );
        } else if (
          isError(e, "INVALID_ARGUMENT") ||
          isError(e, "MISSING_ARGUMENT") ||
          isError(e, "UNEXPECTED_ARGUMENT") ||
          isError(e, "VALUE_MISMATCH")
        ) {
          toastDescription = (
            <ErrorDetails
              msg={
                "Error calling the smart contract function. This is probably a fault in the app. Please try again or contact support if this does not work out."
              }
              ethersError={e}
            />
          );
        } else if (
          isError(e, "UNKNOWN_ERROR") ||
          isError(e, "NOT_IMPLEMENTED") ||
          isError(e, "UNSUPPORTED_OPERATION") ||
          isError(e, "NETWORK_ERROR") ||
          isError(e, "SERVER_ERROR") ||
          isError(e, "TIMEOUT") ||
          isError(e, "BAD_DATA") ||
          isError(e, "CANCELLED")
        ) {
          toastDescription = (
            <ErrorDetails
              msg={"An unexpected error occured while calling the smart contract function. Please contact support."}
              ethersError={e}
            />
          );
        } else if (isError(e, "BUFFER_OVERRUN") || isError(e, "NUMERIC_FAULT")) {
          toastDescription = (
            <ErrorDetails
              msg={"An operationl error occured while calling the smart contract. Please contact support."}
              ethersError={e}
            />
          );
        }

        toast({
          title: "Error",
          description: toastDescription,
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      } finally {
        setSyncingToChain(false);
      }
    }
  }, []);

  return (
    <button
      className="h-10 w-10 rounded-md border border-muted"
      onClick={() => onSyncToChain(wallet, passport)}
      disabled={syncingToChain}
    >
      <div className={`${syncingToChain ? "block" : "hidden"} relative top-1`}>
        <Spinner thickness="2px" speed="0.65s" emptyColor="darkGray" color="gray" size="md" />
      </div>
      <div className={`${syncingToChain ? "hidden" : "block"}`}>{`⛓`}</div>
    </button>
  );
};

export default SyncToChainButton;
