import { PLATFORM_ID, PROVIDER_ID, Passport, StampPatch, ValidResponseBody } from "@gitcoin/passport-types";
import { useState, useEffect, useCallback, useContext } from "react";
import { PlatformProps } from "../components/GenericPlatform";
import { ValidatedPlatform, fetchPossibleEVMStamps } from "../signer/utils";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { IAM_SIGNATURE_TYPE, iamUrl } from "../config/stamp_config";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity";
import { createSignedPayload } from "../utils/helpers";
import { CeramicContext } from "../context/ceramicContext";
import { useWalletStore } from "../context/walletStore";

export const use1ClickVerification = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [validatedPlatforms, setValidatedPlatforms] = useState<ValidatedPlatform[]>([]);
  const { did } = useDatastoreConnectionContext();
  const { passport, allPlatforms } = useContext(CeramicContext);
  const address = useWalletStore((state) => state.address);

  const fetchCredentials = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!did) {
      setIsLoading(false);
      setError(new Error("No DID found"));
      return;
    }

    if (!address) {
      setIsLoading(false);
      setError(new Error("No address"));
      return;
    }

    try {
      const validatedPlatforms = await fetchPossibleEVMStamps(address, allPlatforms, passport);
      if (validatedPlatforms.length === 0) {
        setIsLoading(false);
        // Nothing to do
        return;
      }
      setValidatedPlatforms(validatedPlatforms);
      const platformTypes = validatedPlatforms.map((platform) => platform.platformProps.platform.platformId);
      const validatedProviderIds = validatedPlatforms
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

      // console.log({ patches });

      // const stampPatches: StampPatch[] = validatedProviderIds
      //   .map((provider: PROVIDER_ID) => {
      //     const { credential } =
      //       validCredentials.find((cred) => cred.credential.credentialSubject.provider === provider) || {};
      //     if (credential) return { provider, credential };
      //     // shouldn't need this
      //     // else if (!selectedProviders.includes(provider)) return { provider };
      //     else return null;
      //   })
      //   .filter((patch): patch is StampPatch => patch !== null);

      // await handlePatchStamps(stampPatches);
    } catch (error) {
      setError(error as Error);
    }

    setIsLoading(false);
  }, [address, allPlatforms, passport, did]);

  return { isLoading, error, validatedPlatforms, fetchCredentials };
};
