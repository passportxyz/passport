import { PROVIDER_ID, StampPatch, ValidResponseBody } from "@gitcoin/passport-types";
import { useContext } from "react";
import { fetchPossibleEVMStamps } from "../signer/utils";
import { IAM_SIGNATURE_TYPE, iamUrl } from "../config/stamp_config";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity";
import { createSignedPayload } from "../utils/helpers";
import { CeramicContext } from "../context/ceramicContext";
import { useAtom } from "jotai";
import { mutableUserVerificationAtom } from "../context/userState";
import { datadogLogs } from "@datadog/browser-logs";
import { useToast } from "@chakra-ui/react";
import { DoneToastContent } from "../components/DoneToastContent";
import { DID } from "dids";

export const useOneClickVerification = () => {
  const [verificationState, setUserVerificationState] = useAtom(mutableUserVerificationAtom);

  const { passport, allPlatforms, handlePatchStamps } = useContext(CeramicContext);
  const toast = useToast();

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
      toast({
        duration: 9000,
        isClosable: true,
        render: (result: any) => (
          <DoneToastContent
            title="Success!"
            message="Your stamps are verified!"
            icon="../assets/check-icon2.svg"
            result={result}
          />
        ),
      });
      datadogLogs.logger.info("Successfully completed one click verification", { address });
    } catch (error) {
      setUserVerificationState({
        ...verificationState,
        loading: false,
        error: String(error),
      });
      datadogLogs.logger.error("Error when attempting on click verification", { error: String(error) });
    }
  };

  return { initiateVerification };
};
