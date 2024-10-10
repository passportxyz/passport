import { EasPayload } from "@gitcoin/passport-types";
import { ethers, EthersError, isError } from "ethers";
import { useCallback, useMemo, useState } from "react";
import { useWalletStore } from "../context/walletStore";
import { Chain } from "../utils/chains";
import { useOnChainData } from "./useOnChainData";
import { useSwitchNetwork } from "@web3modal/ethers/react";
import { useMessage } from "./useMessage";

const useChainSwitch = ({ chain }: { chain?: Chain }) => {
  const connectedChain = useWalletStore((state) => state.chain);
  const { switchNetwork } = useSwitchNetwork();

  const switchChain = useCallback(async (): Promise<Boolean> => {
    if (!(connectedChain && chain)) {
      return false;
    }
    if (connectedChain === chain.id) {
      return true;
    }
    try {
      await switchNetwork(parseInt(chain.id, 16));
      return true;
    } catch {
      return false;
    }
  }, [chain, connectedChain, switchNetwork]);

  const needToSwitchChain = connectedChain !== chain?.id;

  return useMemo(() => ({ needToSwitchChain, switchChain }), [needToSwitchChain, switchChain]);
};

export const useAttestation = ({ chain }: { chain?: Chain }) => {
  const { success, failure } = useMessage();
  const { needToSwitchChain, switchChain } = useChainSwitch({ chain });

  const address = useWalletStore((state) => state.address);
  const provider = useWalletStore((state) => state.provider);

  const { refresh } = useOnChainData();

  const getVerifierContract = useCallback(async () => {
    if (!chain || !provider) return;

    if (needToSwitchChain) {
      if (!(await switchChain())) {
        failure({
          title: "Error",
          message: "Unable to switch to the correct network.",
        });
        return;
      }
    }

    const ethersProvider = new ethers.BrowserProvider(provider, "any");

    if (chain.attestationProvider?.status !== "enabled") {
      throw new Error(`Active attestationProvider not found for chainId ${chain.id}`);
    }
    const verifierAddress = chain.attestationProvider.verifierAddress();
    const verifierAbi = chain.attestationProvider.verifierAbi();

    return new ethers.Contract(verifierAddress, verifierAbi, await ethersProvider.getSigner());
  }, [chain, failure, needToSwitchChain, provider, switchChain]);

  const getNonce = useCallback(async () => {
    if (!address) return;

    const verifierContract = await getVerifierContract();
    if (!verifierContract) {
      console.log("Unable to load verifierContract");
      return;
    }
    const nonce = await verifierContract.recipientNonces(address);
    console.log("nonce", nonce);
    return nonce;
  }, [address, getVerifierContract]);

  const issueAttestation = useCallback(
    async ({ data }: { data: EasPayload }) => {
      if (chain) {
        const verifierContract = await getVerifierContract();

        if (!verifierContract) {
          console.log("Unable to load verifierContract");
          return;
        }

        try {
          const { v, r, s } = data.signature;

          const transaction = await verifierContract.verifyAndAttest(data.passport, v, r, s, {
            value: data.passport.fee,
          });

          success({
            title: "Submitted",
            message: "Attestation submitted to chain.",
          });
          await transaction.wait();

          refresh(chain.id);

          success({
            title: "Success",
            message: (
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
            ),
          });
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
              "You don't have sufficient funds to bring your data onchain. Consider funding your wallet first.";
          } else if (isError(e, "CALL_EXCEPTION")) {
            toastDescription = (
              <ErrorDetails msg={"Error writing attestation to chain: " + (e.reason || e.data)} ethersError={e} />
            );
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

          failure({
            title: "Error",
            message: toastDescription,
          });
        }
      }
    },
    [chain, getVerifierContract, success, refresh, address, failure]
  );

  return useMemo(
    () => ({ getNonce, issueAttestation, needToSwitchChain }),
    [getNonce, issueAttestation, needToSwitchChain]
  );
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
