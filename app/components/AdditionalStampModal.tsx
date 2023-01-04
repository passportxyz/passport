// --- React Methods
import React, { useContext, useEffect, useState } from "react";

// Context
import { CeramicContext } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";

// utils
import { fetchPossibleEVMStamps, PossibleEVMProvider, AdditionalSignature } from "../signer/utils";
import { getPlatformSpec } from "../config/platforms";

// Components
import { Button, Spinner } from "@chakra-ui/react";
import { StampSelector } from "./StampSelector";
import { PlatformDetails } from "./PlatformDetails";

// Passport imports
import { PROVIDER_ID, Stamp, VerifiableCredential, VerifiableCredentialRecord } from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";
const rpcUrl = process.env.NEXT_PUBLIC_PASSPORT_MAINNET_RPC_URL;

export const AdditionalStampModal = ({
  additionalSigner,
  onClose,
}: {
  additionalSigner: AdditionalSignature;
  onClose: () => void;
}) => {
  const { allPlatforms, handleAddStamps, handleDeleteStamps } = useContext(CeramicContext);
  const { signer, address } = useContext(UserContext);
  const [possiblyVerifiedPlatforms, setPossiblyVerifiedPlatforms] = useState<PossibleEVMProvider[]>([]);
  const [activePlatform, setActivePlatform] = useState<PossibleEVMProvider | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifiedPlatforms, setVerifiedPlatforms] = useState<string[]>([]);

  // fetch VCs from IAM server
  const handleFetchCredential = async (): Promise<void> => {
    if (activePlatform) {
      const { platform } = activePlatform?.platformProps;
      datadogLogs.logger.info("Saving Stamp", { platform: platform.platformId });
      setLoading(true);
      try {
        // This array will contain all providers that new validated VCs
        let vcs: Stamp[] = [];

        if (selectedProviders.length > 0) {
          const verified: VerifiableCredentialRecord = await fetchVerifiableCredential(
            iamUrl,
            {
              type: platform.platformId,
              types: selectedProviders,
              version: "0.0.0",
              address: address || "",
              proofs: {},
              rpcUrl,
              signer: {
                challenge: additionalSigner.challenge,
                signature: additionalSigner.sig,
                address: additionalSigner.addr,
              },
            },
            // Should this be signed by the original signer so that it is included in the original signers Passport?
            signer as { signMessage: (message: string) => Promise<string> }
          );
          // because we provided a types array in the params we expect to receive a
          // credentials array in the response...
          if (verified.credentials) {
            for (let i = 0; i < verified.credentials.length; i++) {
              let cred = verified.credentials[i];
              if (!cred.error && providerIds.find((providerId: PROVIDER_ID) => cred?.record?.type === providerId)) {
                // add each of the requested/received stamps to the passport...
                vcs.push({
                  provider: cred.record?.type as PROVIDER_ID,
                  credential: cred.credential as VerifiableCredential,
                });
              }
            }
          }
        }

        // Delete all stamps ...
        await handleDeleteStamps(providerIds as PROVIDER_ID[]);

        // .. and now add all newly validate stamps
        if (vcs.length > 0) {
          await handleAddStamps(vcs);
        }
        datadogLogs.logger.info("Successfully saved Stamp", { platform: platform.platformId });
        // grab all providers who are verified from the verify response
        const actualVerifiedProviders = providerIds.filter(
          (providerId) =>
            !!vcs.find((vc: Stamp | undefined) => vc?.credential?.credentialSubject?.provider === providerId)
        );

        // // both verified and selected should look the same after save
        setVerifiedProviders([...actualVerifiedProviders]);
        setSelectedProviders([...actualVerifiedProviders]);

        if (actualVerifiedProviders.length > 0) {
          setVerifiedPlatforms([...verifiedPlatforms, platform.platformId]);
        }

        setLoading(false);
      } catch (e) {
        datadogLogs.logger.error("Verification Error", { error: e, platform: platform.platformId });
        throw e;
      } finally {
        setLoading(false);
      }
    }
  };

  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [verifiedProviders, setVerifiedProviders] = useState<PROVIDER_ID[]>([]);

  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [selectedProviders, setSelectedProviders] = useState<PROVIDER_ID[]>([...verifiedProviders]);

  const providerIds =
    activePlatform?.platformProps.platFormGroupSpec?.reduce((all, stamp, i) => {
      return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
    }, [] as PROVIDER_ID[]) || [];

  useEffect(() => {
    const fetchPlatforms = async () => {
      const verifiedPlatforms = await fetchPossibleEVMStamps(additionalSigner.addr, allPlatforms);
      setPossiblyVerifiedPlatforms(verifiedPlatforms);
    };
    fetchPlatforms();
  }, [allPlatforms, additionalSigner]);

  if (activePlatform) {
    const allAdded = providerIds.length === selectedProviders.length;
    const platform = getPlatformSpec(activePlatform.platformProps.platform.path);
    return (
      <>
        <div className="flex w-full justify-start">
          <button onClick={() => setActivePlatform(null)}>
            <img width="20px" src="./assets/arrow-left-icon.svg" alt="Check Icon" />
          </button>
        </div>
        <PlatformDetails currentPlatform={platform!} />
        <div className="mb-2 w-full">
          <div className="flex w-full justify-between">
            <p className="mb-1 text-left text-sm font-semibold text-gray-600">Accounts</p>
            <a
              className={`cursor-pointer text-sm ${allAdded ? "text-gray-600" : "text-purple-connectPurple"}`}
              data-testid="add-all-btn"
              onClick={() => {
                setSelectedProviders(providerIds);
              }}
            >
              {allAdded ? "Added!" : "Add All"}
            </a>
          </div>
          <hr className="border-1" />
        </div>

        <div className="flex flex-col">
          <StampSelector
            currentProviders={activePlatform.platformProps.platFormGroupSpec}
            verifiedProviders={verifiedProviders}
            selectedProviders={selectedProviders}
            setSelectedProviders={(providerIds) => setSelectedProviders && setSelectedProviders(providerIds)}
          />
        </div>
        <button
          data-testid="verify-btn"
          className="sidebar-verify-btn mx-auto flex justify-center"
          onClick={handleFetchCredential}
        >
          {loading ? (
            <>
              <Spinner size="sm" className="my-auto mr-2" />
              <p>Verifying</p>
            </>
          ) : (
            <p>Verify</p>
          )}
        </button>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center text-center text-gray-900">
        <h2 className="mt-2 font-semibold">Stamp Verification</h2>
        <p className="my-2 text-gray-600">We found the following stamps, select which ones you would like to link.</p>
        <div className="my-4 flex w-full flex-col rounded bg-yellow p-4">
          <p className="text-sm font-semibold">Second Account</p>
          <p className="text-sm">{additionalSigner.addr}</p>
        </div>
        <div className="flex w-full flex-col">
          <p className="w-full text-left text-sm font-semibold text-gray-600">Accounts</p>
          <hr className="border-1" />
          {possiblyVerifiedPlatforms.map((verifiedPlatform: PossibleEVMProvider) => {
            const platform = getPlatformSpec(verifiedPlatform.platformProps.platform.path);
            if (platform) {
              return (
                <div key={platform.name}>
                  <div className="flex w-full justify-between">
                    <div className="flex">
                      <img width="25px" alt="Platform Image" src={platform?.icon} className="m-3" />
                      <p className="pt-2 text-sm font-semibold">{platform.name}</p>
                    </div>
                    {verifiedPlatforms.includes(platform.name) ? (
                      <button
                        onClick={() => setActivePlatform(verifiedPlatform)}
                        className="mt-2 flex h-8 w-24 items-center justify-center rounded-md bg-green-200 py-6 text-sm font-semibold "
                      >
                        <img width="20px" alt="Check Icon" src="./assets/check-icon.svg" />
                        Verified
                      </button>
                    ) : (
                      <Button
                        data-testid={`${verifiedPlatform.platformProps.platform.path}-add-btn`}
                        mt={2}
                        onClick={() => setActivePlatform(verifiedPlatform)}
                      >
                        <img width="20px" alt="Plus Icon" src="./assets/plus-icon.svg" />
                        Add
                      </Button>
                    )}
                  </div>
                  <hr className="border-1" />
                </div>
              );
            }
          })}
        </div>
      </div>
      <button className="sidebar-verify-btn mx-auto flex justify-center" onClick={() => onClose()}>
        Done
      </button>
    </>
  );
};
