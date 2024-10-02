import { EasPayload, VerifiableCredential, EasRequestBody } from "@gitcoin/passport-types";
import { ethers, EthersError, isError } from "ethers";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { useWalletStore } from "../context/walletStore";
import { OnChainStatus } from "../utils/onChainStatus";
import { Chain } from "../utils/chains";
import { useOnChainData } from "./useOnChainData";
import { useSwitchNetwork } from "@web3modal/ethers/react";
import { useMessage } from "./useMessage";
import { useCustomization } from "./useCustomization";

export const useAttestation = ({ chain }: { chain?: Chain }) => {
  const { success, failure } = useMessage();

  const address = useWalletStore((state) => state.address);
  const provider = useWalletStore((state) => state.provider);
  const connectedChain = useWalletStore((state) => state.chain);
  const [verifierContract, setVerifierContract] = useState<any>(undefined);
  const [nonce, setNonce] = useState<number | undefined>(undefined);
  const [nonceCounter, setNonceCounter] = useState<number>(0);

  const resetNonce = () => setNonceCounter((counter) => counter + 1);

  const { refresh } = useOnChainData();
  const { switchNetwork } = useSwitchNetwork();

  useEffect(() => {
    if (!chain || !provider) return;
    (async () => {
      const ethersProvider = new ethers.BrowserProvider(provider, "any");

      if (chain.attestationProvider?.status !== "enabled") {
        throw new Error(`Active attestationProvider not found for chainId ${chain.id}`);
      }
      const verifierAddress = chain.attestationProvider.verifierAddress();
      const verifierAbi = chain.attestationProvider.verifierAbi();

      setVerifierContract(new ethers.Contract(verifierAddress, verifierAbi, await ethersProvider.getSigner()));
    })();
  }, [chain, provider]);

  useEffect(() => {
    if (!verifierContract || !address) return;
    (async () => {
      setNonce(await verifierContract.recipientNonces(address));
    })();
  }, [verifierContract, address, nonceCounter]);

  const onSyncToChain = useCallback(
    async ({ data }: { data: EasPayload }) => {
      if (verifierContract && chain) {
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
            toastDescription = <ErrorDetails msg={"Error writing attestation to chain: " + e.reason} ethersError={e} />;
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
        resetNonce();
      }
    },
    [address, chain?.attestationProvider, chain?.id, verifierContract, refresh, failure, success]
  );

  const issueAttestation = useCallback(
    async ({ data }: { data: EasPayload }) => {
      console.log("issueAttestation", data, connectedChain, chain?.id);
      if (connectedChain && chain && connectedChain !== chain.id) {
        let switchedChain = false;
        try {
          await switchNetwork(parseInt(chain.id, 16));
          switchedChain = true;
        } catch {}
        switchedChain && (await onSyncToChain({ data }));
        return;
      }
      await onSyncToChain({ data });
    },
    [chain?.id, connectedChain, onSyncToChain, switchNetwork]
  );

  return {
    nonce,
    issueAttestation,
  };
};

export const useSyncToChainButton = ({
  chain,
  onChainStatus,
  getButtonMsg,
}: {
  chain?: Chain;
  onChainStatus: OnChainStatus;
  getButtonMsg: (onChainStatus: OnChainStatus) => string;
}) => {
  const { failure } = useMessage();

  const address = useWalletStore((state) => state.address);
  const connectedChain = useWalletStore((state) => state.chain);
  const customization = useCustomization();
  const { nonce, issueAttestation } = useAttestation({ chain });

  const { passport } = useContext(CeramicContext);
  const [syncingToChain, setSyncingToChain] = useState(false);

  const customScorerId = useMemo(
    () => (customization.scorer?.id && chain?.useCustomCommunityId ? customization.scorer.id : undefined),
    [chain?.useCustomCommunityId, customization?.scorer?.id]
  );

  const onInitiateSyncToChain = useCallback(async () => {
    console.log("onInitiateSyncToChain", passport, chain, nonce, address, syncingToChain);
    if (passport && chain && nonce && chain.attestationProvider && !syncingToChain) {
      try {
        setSyncingToChain(true);
        const credentials = passport.stamps.map(({ credential }: { credential: VerifiableCredential }) => credential);

        if (credentials.length === 0) {
          // Nothing to be brought onchain
          failure({
            title: "Error",
            message: "You do not have any Stamps to bring onchain.",
          });
          return;
        }

        const payload: EasRequestBody = {
          recipient: address || "",
          credentials,
          nonce,
          chainIdHex: chain.id,
          customScorerId,
        };

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
          // TODO: maybe we should prompt the user if he wants to continue? Maybe he wants to refresh his attestations first?
          console.log("not syncing invalid credentials (invalid credentials): ", data.invalidCredentials);
        }

        await issueAttestation({ data });
      } catch (e) {
        console.error("error syncing credentials to chain: ", e);
        failure({
          title: "Error",
          message: "An unexpected error occurred while trying to bring the data onchain.",
        });
      } finally {
        setSyncingToChain(false);
      }
    }
  }, [passport, chain, nonce, address, syncingToChain, issueAttestation, failure, customScorerId]);

  const isActive = chain?.attestationProvider?.status === "enabled";
  const disableBtn = !isActive || onChainStatus === OnChainStatus.MOVED_UP_TO_DATE;
  const needToSwitchChain = isActive && onChainStatus !== OnChainStatus.MOVED_UP_TO_DATE && chain.id !== connectedChain;

  const className = disableBtn ? "cursor-not-allowed" : "";
  const disabled = disableBtn;

  const text = isActive ? getButtonMsg(onChainStatus) : "Coming Soon";

  return {
    syncingToChain,
    needToSwitchChain,
    text,
    props: {
      onClick: onInitiateSyncToChain,
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
