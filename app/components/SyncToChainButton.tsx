import { Spinner, useToast } from "@chakra-ui/react";
import { EasPayload, VerifiableCredential } from "@gitcoin/passport-types";
import { ethers, EthersError, isError } from "ethers";
import { useCallback, useContext, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { OnChainContext } from "../context/onChainContext";
import { UserContext } from "../context/userContext";
import onchainInfo from "../../deployments/onchainInfo.json";
import GitcoinVerifierAbi from "../../deployments/abi/GitcoinVerifier.json";
import { DoneToastContent } from "./DoneToastContent";
import { OnChainStatus } from "./NetworkCard";
import { Chain } from "../utils/onboard";
import axios from "axios";
import { useSetChain } from "@web3-onboard/react";
import Tooltip from "../components/Tooltip";

export function getButtonMsg(onChainStatus: OnChainStatus): string {
  switch (onChainStatus) {
    case OnChainStatus.NOT_MOVED:
      return "Go";
    case OnChainStatus.MOVED_OUT_OF_DATE:
      return "Update";
    case OnChainStatus.MOVED_UP_TO_DATE:
      return "Up to date";
  }
}

const fail = "../assets/verification-failed-bright.svg";
const success = "../../assets/check-icon2.svg";

export type ErrorDetailsProps = {
  msg: string;
  ethersError: EthersError;
};

export const ErrorDetails = ({ msg, ethersError }: ErrorDetailsProps): JSX.Element => {
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
      <b>
        <a href="#" onClick={toggleDetails}>
          {textLabelDisplay}
        </a>
      </b>
      <div style={{ display: displayDetails, overflowY: "scroll", maxHeight: "200px" }}>{ethersError.message}</div>
    </div>
  );
};

export type SyncToChainProps = {
  onChainStatus: OnChainStatus;
  isActive: boolean;
  chain: Chain;
};

export function SyncToChainButton({ onChainStatus, isActive, chain }: SyncToChainProps): JSX.Element {
  const { passport } = useContext(CeramicContext);
  const { wallet, address } = useContext(UserContext);
  const { readOnChainData } = useContext(OnChainContext);
  const [{ connectedChain }, setChain] = useSetChain();
  const [syncingToChain, setSyncingToChain] = useState(false);
  const toast = useToast();

  const loadVerifierContract = useCallback(
    async (wallet) => {
      const ethersProvider = new ethers.BrowserProvider(wallet.provider, "any");

      if (!Object.keys(onchainInfo).includes(chain.id)) {
        throw new Error(`No onchainInfo found for chainId ${chain.id}`);
      }
      const onchainInfoChainId = chain.id as keyof typeof onchainInfo;
      const verifierAddress = onchainInfo[onchainInfoChainId].GitcoinVerifier.address;
      const verifierAbi = GitcoinVerifierAbi[onchainInfoChainId];

      return new ethers.Contract(verifierAddress, verifierAbi, await ethersProvider.getSigner());
    },
    [chain]
  );

  const onInitiateSyncToChain = useCallback(async (wallet, passport) => {
    if (connectedChain && connectedChain?.id !== chain.id) {
      const setChainResponse = await setChain({ chainId: chain.id });
      setChainResponse && (await onSyncToChain(wallet, passport));
      return;
    }
    await onSyncToChain(wallet, passport);
  }, []);

  const onSyncToChain = useCallback(async (wallet, passport) => {
    if (passport && wallet) {
      try {
        setSyncingToChain(true);
        const credentials = passport.stamps.map(({ credential }: { credential: VerifiableCredential }) => credential);
        const gitcoinVerifierContract = await loadVerifierContract(wallet);

        if (credentials.length === 0) {
          // Nothing to be brought on-chain
          toast({
            duration: 9000,
            isClosable: true,
            render: (result: any) => (
              <DoneToastContent
                title="Error"
                message="You do not have any stamps to bring on-chain."
                icon={fail}
                result={result}
              />
            ),
          });
          return;
        }

        const nonce = await gitcoinVerifierContract.recipientNonces(address);

        const payload = {
          credentials,
          nonce,
          chainIdHex: chain.id,
        };

        const { data }: { data: EasPayload } = await axios.post(
          `${process.env.NEXT_PUBLIC_PASSPORT_IAM_URL}v0.0.0/eas/passport`,
          payload,
          {
            headers: {
              "Content-Type": "application/json",
            },
            transformRequest: [
              (data: any) => JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v)),
            ],
          }
        );

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

          const transaction = await gitcoinVerifierContract.verifyAndAttest(data.passport, v, r, s, {
            value: data.passport.fee,
            gasLimit: 1000000,
          });
          toast({
            duration: 9000,
            isClosable: true,
            render: (result: any) => (
              <DoneToastContent
                title="Submitted"
                message="Passport submitted to chain."
                icon={success}
                result={result}
              />
            ),
          });
          await transaction.wait();

          const easScanBaseUrl = chain.easScanUrl;
          if (!easScanBaseUrl) {
            throw new Error(`No EAS scan URL found for chain ${chain.id}`);
          }
          const easScanURL = `${easScanBaseUrl}/address/${address}`;
          await readOnChainData();
          const successSubmit = (
            <p>
              Passport successfully synced to chain.{" "}
              <a href={`${easScanURL}`} className="underline" target="_blank" rel="noopener noreferrer">
                Check your stamps
              </a>
            </p>
          );

          toast({
            duration: 9000,
            isClosable: true,
            render: (result: any) => (
              <DoneToastContent title="Success" body={successSubmit} icon={success} result={result} />
            ),
          });
        }
      } catch (e: any) {
        console.error("error syncing credentials to chain: ", e);
        let toastDescription: string | JSX.Element =
          "An unexpected error occurred while trying to bring the data on-chain.";
        if (isError(e, "ACTION_REJECTED")) {
          toastDescription = "Transaction rejected by user";
        } else if (isError(e, "INSUFFICIENT_FUNDS") || e?.info?.error?.data?.message.includes("insufficient funds")) {
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
              msg={"A Blockchain error occurred while executing this transaction. Please try again in a few minutes."}
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
              msg={"An unexpected error occurred while calling the smart contract function. Please contact support."}
              ethersError={e}
            />
          );
        } else if (isError(e, "BUFFER_OVERRUN") || isError(e, "NUMERIC_FAULT")) {
          toastDescription = (
            <ErrorDetails
              msg={"An operational error occurred while calling the smart contract. Please contact support."}
              ethersError={e}
            />
          );
        }

        toast({
          duration: 9000,
          isClosable: true,
          render: (result: any) => (
            <DoneToastContent title="Error" body={toastDescription} icon={fail} result={result} />
          ),
        });
      } finally {
        setSyncingToChain(false);
      }
    }
  }, []);

  const disableBtn = !isActive || onChainStatus === OnChainStatus.MOVED_UP_TO_DATE;
  const showToolTip = isActive && onChainStatus !== OnChainStatus.MOVED_UP_TO_DATE && chain.id !== connectedChain?.id;

  return (
    <button
      className={`verify-btn center ${disableBtn && "cursor-not-allowed"} flex justify-center`}
      data-testid="sync-to-chain-button"
      onClick={() => onInitiateSyncToChain(wallet, passport)}
      disabled={disableBtn}
    >
      <div className={`${syncingToChain ? "block" : "hidden"} relative top-1`}>
        <Spinner thickness="2px" speed="0.65s" emptyColor="darkGray" color="gray" size="md" />
      </div>
      <span
        className={`mx-1 translate-y-[1px] ${syncingToChain ? "hidden" : "block"} ${
          onChainStatus === OnChainStatus.MOVED_UP_TO_DATE ? "text-accent-3" : "text-muted"
        }`}
      >
        {isActive ? getButtonMsg(onChainStatus) : "Coming Soon"}
      </span>
      {showToolTip && <Tooltip>You will be prompted to switch to {chain.label} and sign the transaction</Tooltip>}
    </button>
  );
}
