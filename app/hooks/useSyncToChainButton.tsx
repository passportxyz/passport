import { useToast } from "@chakra-ui/react";
import { EasPayload, VerifiableCredential } from "@gitcoin/passport-types";
import { ethers, EthersError, isError } from "ethers";
import { useCallback, useContext, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { OnChainContext } from "../context/onChainContext";
import { useWalletStore } from "../context/walletStore";
import { DoneToastContent } from "../components/DoneToastContent";
import { OnChainStatus } from "../utils/onChainStatus";
import { Chain } from "../utils/chains";
import { useSetChain } from "@web3-onboard/react";

const fail = "../assets/verification-failed-bright.svg";
const success = "../../assets/check-icon2.svg";

export const useSyncToChainButton = ({
  chain,
  onChainStatus,
  getButtonMsg,
}: {
  chain?: Chain;
  onChainStatus: OnChainStatus;
  getButtonMsg: (onChainStatus: OnChainStatus) => string;
}) => {
  const toast = useToast();

  const address = useWalletStore((state) => state.address);
  const provider = useWalletStore((state) => state.provider);

  const { passport } = useContext(CeramicContext);
  const { readOnChainData } = useContext(OnChainContext);
  const [{ connectedChain }, setChain] = useSetChain();
  const [syncingToChain, setSyncingToChain] = useState(false);

  const loadVerifierContract = useCallback(
    async (provider) => {
      if (!chain) return;
      const ethersProvider = new ethers.BrowserProvider(provider, "any");

      if (chain.attestationProvider?.status !== "enabled") {
        throw new Error(`Active attestationProvider not found for chainId ${chain.id}`);
      }
      const verifierAddress = chain.attestationProvider.verifierAddress();
      const verifierAbi = chain.attestationProvider.verifierAbi();

      return new ethers.Contract(verifierAddress, verifierAbi, await ethersProvider.getSigner());
    },
    [chain]
  );

  const onSyncToChain = useCallback(
    async (provider, passport) => {
      if (passport && provider && chain) {
        try {
          setSyncingToChain(true);
          const credentials = passport.stamps.map(({ credential }: { credential: VerifiableCredential }) => credential);
          const gitcoinVerifierContract = await loadVerifierContract(provider);
          if (!gitcoinVerifierContract) return;

          if (credentials.length === 0) {
            // Nothing to be brought onchain
            toast({
              duration: 9000,
              isClosable: true,
              render: (result: any) => (
                <DoneToastContent
                  title="Error"
                  message="You do not have any Stamps to bring onchain."
                  icon={fail}
                  result={result}
                />
              ),
            });
            return;
          }

          const nonce = await gitcoinVerifierContract.recipientNonces(address);

          const payload = {
            recipient: address,
            credentials,
            nonce,
            chainIdHex: chain.id,
          };

          if (chain && chain.attestationProvider) {
            const { data }: { data: EasPayload } = await chain.attestationProvider.getMultiAttestationRequest(payload);

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
              // This can only happen when trying to bring the entire passport onchain
              // This cannot happen when we only bring the score onchain
              // TODO: maybe we should prompt the user if he wants to continue? Maybe he wants to refresh his attenstations first?
              console.log("not syncing invalid credentials (invalid credentials): ", data.invalidCredentials);
            }

            if (data.passport) {
              const { v, r, s } = data.signature;

              const transaction = await gitcoinVerifierContract.verifyAndAttest(data.passport, v, r, s, {
                value: data.passport.fee,
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

              await readOnChainData();
              const successSubmit = (
                <p>
                  Passport successfully synced to chain.{" "}
                  {chain?.attestationProvider?.hasWebViewer && address && (
                    <a
                      href={chain.attestationProvider.viewerUrl(address)}
                      className="underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Check your attestations
                    </a>
                  )}
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
          }
        } catch (e: any) {
          console.error("error syncing credentials to chain: ", e);
          let toastDescription: string | JSX.Element =
            "An unexpected error occurred while trying to bring the data onchain.";
          if (isError(e, "ACTION_REJECTED")) {
            toastDescription = "Transaction rejected by user";
          } else if (
            isError(e, "INSUFFICIENT_FUNDS") ||
            e?.info?.error?.data?.message?.includes("insufficient funds")
          ) {
            toastDescription =
              "You don't have sufficient funds to bring your Stamps onchain. Consider funding your wallet first.";
          } else if (isError(e, "CALL_EXCEPTION")) {
            toastDescription = <ErrorDetails msg={"Error writing Stamps to chain: " + e.reason} ethersError={e} />;
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
    },
    [address, chain?.attestationProvider, chain?.id, loadVerifierContract, readOnChainData, toast]
  );

  const onInitiateSyncToChain = useCallback(
    async (provider, passport) => {
      if (connectedChain && chain && connectedChain?.id !== chain.id) {
        const setChainResponse = await setChain({ chainId: chain.id });
        setChainResponse && (await onSyncToChain(provider, passport));
        return;
      }
      await onSyncToChain(provider, passport);
    },
    [chain?.id, connectedChain, onSyncToChain, setChain]
  );

  const isActive = chain?.attestationProvider?.status === "enabled";
  const disableBtn = !isActive || onChainStatus === OnChainStatus.MOVED_UP_TO_DATE;
  const needToSwitchChain =
    isActive && onChainStatus !== OnChainStatus.MOVED_UP_TO_DATE && chain.id !== connectedChain?.id;

  const onClick = () => onInitiateSyncToChain(provider, passport);
  const className = disableBtn ? "cursor-not-allowed" : "";
  const disabled = disableBtn;

  const text = isActive ? getButtonMsg(onChainStatus) : "Coming Soon";

  return {
    syncingToChain,
    needToSwitchChain,
    text,
    props: {
      onClick,
      className,
      disabled,
    },
  };
};

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
