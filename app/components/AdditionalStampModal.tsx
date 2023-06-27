// --- React Methods
import React, { useContext, useEffect, useState } from "react";

// Context
import { CeramicContext } from "../context/ceramicContext";
import { UserContext } from "../context/userContext";

// utils
import { fetchPossibleEVMStamps, ValidatedPlatform, AdditionalSignature } from "../signer/utils";
import { getPlatformSpec } from "../config/platforms";

// Components
import { Spinner } from "@chakra-ui/react";
import { StampSelector } from "./StampSelector";
import { PlatformDetails } from "./PlatformDetails";
import { Button } from "./Button";
import { LoadButton } from "./LoadButton";

// Passport imports
import { PROVIDER_ID, Stamp, VerifiableCredential, VerifiableCredentialRecord } from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";

export const AdditionalStampModal = ({
  additionalSigner,
  onClose,
}: {
  additionalSigner: AdditionalSignature;
  onClose: () => void;
}) => {
  const { allPlatforms, handleAddStamps, handleDeleteStamps } = useContext(CeramicContext);
  const { signer, address } = useContext(UserContext);
  const [platformsLoading, setPlatformsLoading] = useState(false);
  const [possiblyVerifiedPlatforms, setPossiblyVerifiedPlatforms] = useState<ValidatedPlatform[]>([]);
  const [activePlatform, setActivePlatform] = useState<ValidatedPlatform | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifiedPlatforms, setVerifiedPlatforms] = useState<string[]>([]);

  const resetState = () => {
    setPossiblyVerifiedPlatforms([]);
    setActivePlatform(null);
    setVerifiedPlatforms([]);
  };

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
          (providerId: any) =>
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
      return all.concat(stamp.providers?.map((provider: any) => provider.name as PROVIDER_ID));
    }, [] as PROVIDER_ID[]) || [];

  useEffect(() => {
    const fetchPlatforms = async () => {
      setPlatformsLoading(true);
      const verifiedPlatforms = await fetchPossibleEVMStamps(additionalSigner.addr, allPlatforms, undefined);
      setPossiblyVerifiedPlatforms(verifiedPlatforms);
      setPlatformsLoading(false);
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
            <img width="20px" className="invert" src="./assets/arrow-left-icon.svg" alt="Check Icon" />
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

        <div className="mb-4 flex w-full flex-col">
          <StampSelector
            currentProviders={activePlatform.platformProps.platFormGroupSpec}
            verifiedProviders={verifiedProviders}
            selectedProviders={selectedProviders}
            setSelectedProviders={(providerIds) => setSelectedProviders && setSelectedProviders(providerIds)}
          />
        </div>
        <LoadButton isLoading={loading} className="w-1/2" data-testid="verify-btn" onClick={handleFetchCredential}>
          {loading ? "Verifying" : "Verify"}
        </LoadButton>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col items-center text-center">
        <h2 className="mt-2 font-semibold">Stamp Verification</h2>
        <p className="my-2">We found the following stamps, select which ones you would like to link.</p>
        <div className="my-4 flex w-full flex-col rounded-md border border-accent-2 p-4">
          <p className="text-sm font-semibold">Second Account</p>
          <p className="text-sm">{additionalSigner.addr}</p>
        </div>
        <div className="flex w-full flex-col">
          <p className="w-full text-left text-sm font-semibold">Accounts</p>
          <hr className="border-1" />
          {platformsLoading ? (
            <div className="mt-6 flex w-full justify-center">
              <Spinner size="lg" />
            </div>
          ) : (
            possiblyVerifiedPlatforms.map((verifiedPlatform: ValidatedPlatform) => {
              const platform = getPlatformSpec(verifiedPlatform.platformProps.platform.path);
              if (platform) {
                return (
                  <div key={platform.name}>
                    <div className="flex w-full justify-between">
                      <div className="flex items-center">
                        <img alt="Platform Image" src={platform?.icon} className="m-3 h-8 w-8" />
                        <p className="font-semibold">{platform.name}</p>
                      </div>
                      {verifiedPlatforms.includes(platform.name) ? (
                        <Button onClick={() => setActivePlatform(verifiedPlatform)} className="my-2">
                          <div className="flex items-center">
                            <img width="20px" className="pr-1" alt="Check Icon" src="./assets/check-icon.svg" />
                            Verified
                          </div>
                        </Button>
                      ) : (
                        <Button
                          data-testid={`${verifiedPlatform.platformProps.platform.path}-add-btn`}
                          onClick={() => setActivePlatform(verifiedPlatform)}
                          className="my-2"
                        >
                          <div className="flex items-center">
                            <img className="pr-1 invert" width="20px" alt="Plus Icon" src="./assets/plus-icon.svg" />
                            Add
                          </div>
                        </Button>
                      )}
                    </div>
                    <hr className="border-1" />
                  </div>
                );
              }
            })
          )}
          {!platformsLoading && possiblyVerifiedPlatforms.length === 0 && (
            <p className="mt-4 font-semibold">Additional stamps were not Found</p>
          )}
        </div>
      </div>
      <Button
        className="mt-4 w-1/2"
        onClick={() => {
          resetState();
          onClose();
        }}
      >
        Done
      </Button>
    </>
  );
};
