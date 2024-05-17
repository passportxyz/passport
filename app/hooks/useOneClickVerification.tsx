import { PROVIDER_ID, StampPatch, ValidResponseBody } from "@gitcoin/passport-types";
import { useContext } from "react";
import { fetchPossibleEVMStamps } from "../signer/utils";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { IAM_SIGNATURE_TYPE, iamUrl } from "../config/stamp_config";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity";
import { createSignedPayload } from "../utils/helpers";
import { CeramicContext } from "../context/ceramicContext";
import { useWalletStore } from "../context/walletStore";
import { useAtom } from "jotai";
import { userVerificationAtom } from "../context/userState";

export const useOneClickVerification = () => {
  const [verificationState, setUserVerificationState] = useAtom(userVerificationAtom);

  const { did } = useDatastoreConnectionContext();
  const { passport, allPlatforms, handlePatchStamps } = useContext(CeramicContext);
  const address = useWalletStore((state) => state.address);

  const initiateVerification = async function () {
    if (!did || !address) {
      return;
    }
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
      const platformTypes = possiblePlatforms.map((platform) => platform.platformProps.platform.platformId);
      const validatedProviderIds = possiblePlatforms
        .map((platform) =>
          platform.platformProps.platFormGroupSpec.map((group) => group.providers.map((provider) => provider.name))
        )
        .flat(2);

      const credentialResponse = await fetchVerifiableCredential(
        iamUrl,
        {
          type: "EVMBulkVerify",
          types: platformTypes,
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
    } catch (error) {
      setUserVerificationState({
        ...verificationState,
        loading: false,
        error: String(error),
      });
    }
    setUserVerificationState({
      ...verificationState,
      loading: false,
    });
  };

  return { initiateVerification };
};
