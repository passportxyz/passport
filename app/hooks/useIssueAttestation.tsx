import { EasPayload } from "@gitcoin/passport-types";
import { useCallback, useEffect, useMemo } from "react";
import { useOnChainData } from "./useOnChainData";
import { useMessage } from "./useMessage";
import { useAccount, useReadContract, useSwitchChain, useWriteContract } from "wagmi";
import { Chain } from "../utils/chains";
import { useQueryClient } from "@tanstack/react-query";

const useChainSwitch = ({ chain }: { chain?: Chain }) => {
  const { chain: connectedChain } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  const chainId = chain && parseInt(chain.id);

  const switchChain = useCallback(async (): Promise<Boolean> => {
    if (!(connectedChain && chainId)) {
      return false;
    }
    if (connectedChain.id === chainId) {
      return true;
    }
    try {
      await switchChainAsync({ chainId });
      return true;
    } catch {
      return false;
    }
  }, [connectedChain, chain, switchChainAsync]);

  const needToSwitchChain = connectedChain?.id !== chainId;

  return useMemo(() => ({ needToSwitchChain, switchChain }), [needToSwitchChain, switchChain]);
};

const useVerifierContractInfo = ({ chain }: { chain?: Chain }) => {
  const address = chain?.attestationProvider?.verifierAddress();
  const abi = chain?.attestationProvider?.verifierAbi();

  if (chain && chain.attestationProvider?.status !== "enabled") {
    throw new Error(`Active attestationProvider not found for chainId ${chain.id}`);
  }

  return useMemo(() => ({ address, abi }), [address, abi]);
};

export const useAttestationNonce = ({
  chain,
}: {
  chain?: Chain;
}): {
  isLoading: boolean;
  isError: boolean;
  nonce?: number;
  refresh: () => void;
} => {
  const { address, abi } = useVerifierContractInfo({ chain });

  if (!chain || !address || !abi) return { isLoading: true, refresh: () => {}, isError: false };

  const { failure } = useMessage();
  const queryClient = useQueryClient();

  const { data, isLoading, isError, error, queryKey } = useReadContract({
    abi,
    address: address as `0x${string}`,
    functionName: "recipientNonces",
    args: [address],
    chainId: parseInt(chain.id),
  });

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey });
  }, [queryClient, queryKey]);

  useEffect(() => {
    if (isError) {
      console.error("Failed reading attestation nonce", error);
      failure({
        title: "Error",
        message: "Failed reading attestation nonce",
      });
    }
  }, [isError, failure]);

  const nonce = data ? Number(data as bigint) : undefined;

  return useMemo(() => ({ nonce, isLoading, refresh, isError }), [nonce, isLoading, refresh, isError]);
};

export const useIssueAttestation = ({ chain }: { chain?: Chain }) => {
  const { address, abi } = useVerifierContractInfo({ chain });
  const { success, failure } = useMessage();
  const { needToSwitchChain, switchChain } = useChainSwitch({ chain });
  const { writeContractAsync } = useWriteContract();
  const { refresh: refreshNonce } = useAttestationNonce({ chain });
  const { refresh: refreshOnchainData } = useOnChainData();

  const issueAttestation = useCallback(
    async ({ data }: { data: EasPayload }) => {
      if (chain && abi && address) {
        if (needToSwitchChain) {
          const switched = await switchChain();
          if (!switched) {
            return;
          }
        }

        try {
          const { v, r, s } = data.signature;

          const attestationTransaction = writeContractAsync({
            chainId: parseInt(chain.id),
            address: address as `0x${string}`,
            abi,
            functionName: "verifyAndAttest",
            args: [data.passport, v, r, s] as unknown[],
            value: data.passport.fee,
          });

          success({
            title: "Submitted",
            message: "Attestation submitted to chain.",
          });

          await attestationTransaction;

          refreshNonce();
          refreshOnchainData(chain.id);

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
          // if (isError(e, "ACTION_REJECTED")) {
          //   toastDescription = "Transaction rejected by user";
          // } else if (
          //   isError(e, "INSUFFICIENT_FUNDS") ||
          //   e?.info?.error?.data?.message?.includes("insufficient funds")
          // ) {
          //   toastDescription =
          //     "You don't have sufficient funds to bring your data onchain. Consider funding your wallet first.";
          // } else if (isError(e, "CALL_EXCEPTION")) {
          //   toastDescription = (
          //     <ErrorDetails msg={"Error writing attestation to chain: " + (e.reason || e.data)} ethersError={e} />
          //   );
          // } else if (
          //   isError(e, "NONCE_EXPIRED") ||
          //   isError(e, "REPLACEMENT_UNDERPRICED") ||
          //   isError(e, "TRANSACTION_REPLACED") ||
          //   isError(e, "UNCONFIGURED_NAME") ||
          //   isError(e, "OFFCHAIN_FAULT")
          // ) {
          //   toastDescription = (
          //     <ErrorDetails
          //       msg={"A Blockchain error occurred while executing this transaction. Please try again in a few minutes."}
          //       ethersError={e}
          //     />
          //   );
          // } else if (
          //   isError(e, "INVALID_ARGUMENT") ||
          //   isError(e, "MISSING_ARGUMENT") ||
          //   isError(e, "UNEXPECTED_ARGUMENT") ||
          //   isError(e, "VALUE_MISMATCH")
          // ) {
          //   toastDescription = (
          //     <ErrorDetails
          //       msg={
          //         "Error calling the smart contract function. This is probably a fault in the app. Please try again or contact support if this does not work out."
          //       }
          //       ethersError={e}
          //     />
          //   );
          // } else if (
          //   isError(e, "UNKNOWN_ERROR") ||
          //   isError(e, "NOT_IMPLEMENTED") ||
          //   isError(e, "UNSUPPORTED_OPERATION") ||
          //   isError(e, "NETWORK_ERROR") ||
          //   isError(e, "SERVER_ERROR") ||
          //   isError(e, "TIMEOUT") ||
          //   isError(e, "BAD_DATA") ||
          //   isError(e, "CANCELLED")
          // ) {
          //   toastDescription = (
          //     <ErrorDetails
          //       msg={"An unexpected error occurred while calling the smart contract function. Please contact support."}
          //       ethersError={e}
          //     />
          //   );
          // } else if (isError(e, "BUFFER_OVERRUN") || isError(e, "NUMERIC_FAULT")) {
          //   toastDescription = (
          //     <ErrorDetails
          //       msg={"An operational error occurred while calling the smart contract. Please contact support."}
          //       ethersError={e}
          //     />
          //   );
          // }

          failure({
            title: "Error",
            message: toastDescription,
          });
        }
      }
    },
    [
      chain,
      address,
      abi,
      needToSwitchChain,
      switchChain,
      writeContractAsync,
      success,
      failure,
      refreshNonce,
      refreshOnchainData,
    ]
  );

  return useMemo(() => ({ issueAttestation, needToSwitchChain }), [issueAttestation, needToSwitchChain]);
};

// export type ErrorDetailsProps = {
//   msg: string;
//   ethersError: EthersError;
// };
//
// export const ErrorDetails = ({ msg, ethersError }: ErrorDetailsProps): JSX.Element => {
//   const [displayDetails, setDisplayDetails] = useState<string>("none");
//   const [textLabelDisplay, setTextLabelDisplay] = useState<string>("Show details");
//
//   const copyDetailsToClipboard = (e: React.MouseEvent<HTMLAnchorElement>) => {
//     e.preventDefault();
//     navigator.clipboard.writeText(ethersError.message);
//   };
//
//   const toggleDetails = (e: React.MouseEvent<HTMLAnchorElement>) => {
//     e.preventDefault();
//     if (displayDetails === "none") {
//       setDisplayDetails("block");
//       setTextLabelDisplay("Hide details");
//     } else {
//       setDisplayDetails("none");
//       setTextLabelDisplay("Show details");
//     }
//   };
//   return (
//     <div>
//       <p>{msg}</p>
//       <br></br>
//       Please{" "}
//       <b>
//         <a href="#" onClick={copyDetailsToClipboard}>
//           copy transaction details{" "}
//         </a>
//       </b>{" "}
//       in case you contact our support.{" "}
//       <b>
//         <a href="#" onClick={toggleDetails}>
//           {textLabelDisplay}
//         </a>
//       </b>
//       <div style={{ display: displayDetails, overflowY: "scroll", maxHeight: "200px" }}>{ethersError.message}</div>
//     </div>
//   );
// };
