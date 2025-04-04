import { PROVIDER_ID, StampPatch, ValidResponseBody } from "@gitcoin/passport-types";
import { useContext, useEffect, useMemo } from "react";
import { fetchPossibleEVMStamps } from "../signer/utils";
import { IAM_SIGNATURE_TYPE, iamUrl } from "../config/stamp_config";
import { fetchVerifiableCredential } from "../utils/credentials";
import { createSignedPayload } from "../utils/helpers";
import { CeramicContext } from "../context/ceramicContext";
import { useAtom } from "jotai";
import { mutableUserVerificationAtom } from "../context/userState";
import { datadogLogs } from "@datadog/browser-logs";
import { DID } from "dids";
import { useMessage } from "./useMessage";

export const useOneClickVerification = () => {
  const [verificationState, setUserVerificationState] = useAtom(mutableUserVerificationAtom);

  const { passport, allPlatforms, handlePatchStamps } = useContext(CeramicContext);
  const { success } = useMessage();

  const initiateVerification = async function (did: DID, address: string) {
    datadogLogs.logger.info("Initiating one click verification", { address });
    setUserVerificationState({
      ...verificationState,
      loading: true,
    });

    try {
      const possiblePlatforms = await fetchPossibleEVMStamps(address, allPlatforms, passport, true);
      if (possiblePlatforms.length === 0) {
        setUserVerificationState({
          ...verificationState,
          success: true,
          loading: false,
        });
        // Nothing to do
        return;
      }

      setUserVerificationState({
        ...verificationState,
        loading: true,
      });
      const validatedProviderIds = possiblePlatforms
        .map((platform) =>
          platform.platformProps.platFormGroupSpec.map((group) => group.providers.map((provider) => provider.name))
        )
        .flat(2);

      const credentialResponse = await fetchVerifiableCredential(
        iamUrl,
        {
          type: "EVMBulkVerify",
          types: validatedProviderIds,
          version: "0.0.0",
          address: address || "",
          proofs: {},
          signatureType: IAM_SIGNATURE_TYPE,
        },
        (data: any) => createSignedPayload(did, data)
      );

      // Should be able to assume that all stamps should be patched
      const validCredentials =
        credentialResponse.credentials?.filter((cred: any): cred is ValidResponseBody => !cred.error) || [];

      const stampPatches: StampPatch[] = validatedProviderIds
        .map((provider: PROVIDER_ID) => {
          const { credential } =
            validCredentials.find((cred) => cred.credential.credentialSubject.provider === provider) || {};
          if (credential) return { provider, credential };
          else if (!validatedProviderIds.includes(provider)) return { provider };
          else return null;
        })
        .filter((patch): patch is StampPatch => patch !== null);

      await handlePatchStamps(stampPatches);

      setUserVerificationState({
        ...verificationState,
        loading: false,
        success: true,
      });
      success({
        title: "Success!",
        message: "Your stamps are verified!",
      });
      datadogLogs.logger.info("Successfully completed one click verification", { address });
    } catch (error) {
      console.error("Error when attempting one click verification", error);
      setUserVerificationState({
        ...verificationState,
        loading: false,
        error: String(error),
      });
      datadogLogs.logger.error("Error when attempting on click verification", { error: String(error) });
    }
  };

  const verificationComplete = useMemo(() => {
    return verificationState.error || verificationState.success;
  }, [verificationState.error, verificationState.success]);

  return { initiateVerification, verificationState, verificationComplete };
};
