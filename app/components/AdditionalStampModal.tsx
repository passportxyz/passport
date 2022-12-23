// --- React Methods
import React, { useContext, useEffect, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { AdditionalSignature } from "../signer/utils";
import { PlatformGroupSpec } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { fetchPossibleEVMStamps, PossibleEVMProvider } from "../signer/utils";
import { getPlatformSpec, PlatformSpec } from "../config/platforms";
import { Button, Spinner } from "@chakra-ui/react";
import { StampSelector } from "./StampSelector";
import { PROVIDER_ID, Stamp, VerifiableCredential, VerifiableCredentialRecord } from "@gitcoin/passport-types";
import { PlatformDetails } from "./PlatformDetails";

import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";
import { signMessageForAdditionalSigner } from "../signer/utils";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";
import { generateUID } from "../utils/helpers";
import { JsonRpcSigner } from "@ethersproject/providers";

const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";
const rpcUrl = process.env.NEXT_PUBLIC_PASSPORT_MAINNET_RPC_URL;

export const AdditionalStampModal = ({ additionalSigner }: { additionalSigner: AdditionalSignature }) => {
  const { allPlatforms } = useContext(CeramicContext);
  const [verifiedPlatforms, setVerifiedPlatforms] = useState<PossibleEVMProvider[]>([]);
  const [activePlatform, setActivePlatform] = useState<PossibleEVMProvider | null>(null);
  const [loading, setLoading] = useState(false);

  // fetch VCs from IAM server
  const handleFetchCredential = async (): Promise<void> => {
    if (activePlatform) {
      const { platform } = activePlatform?.platformProps;
      datadogLogs.logger.info("Saving Stamp", { platform: platform.platformId });
      setLoading(true);
      try {
        // This array will contain all providers that new validated VCs
        let vcs: Stamp[] = [];

        console.log(additionalSigner.addr, "additionalSigner.addr");
        if (selectedProviders.length > 0) {
          const verified: VerifiableCredentialRecord = await fetchVerifiableCredential(
            iamUrl,
            {
              type: platform.platformId,
              types: selectedProviders,
              version: "0.0.0",
              address: additionalSigner.addr || "",
              proofs: {},
              rpcUrl,
            },
            { signMessage: signMessageForAdditionalSigner } as { signMessage: (message: string) => Promise<string> }
          );
          console.log({ verified });

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

        // .. and now add all newly validate stamps
        // if (vcs.length > 0) {
        //   await handleAddStamps(vcs);
        // }
        // datadogLogs.logger.info("Successfully saved Stamp", { platform: platform.platformId });
        // // grab all providers who are verified from the verify response
        // const actualVerifiedProviders = providerIds.filter(
        //   (providerId) =>
        //     !!vcs.find((vc: Stamp | undefined) => vc?.credential?.credentialSubject?.provider === providerId)
        // );
        // // both verified and selected should look the same after save
        // setVerifiedProviders([...actualVerifiedProviders]);
        // setSelectedProviders([...actualVerifiedProviders]);

        // // Create Set to check changed providers after verification
        // const updatedVerifiedProviders = new Set(actualVerifiedProviders);
        // // Initial providers Set minus updated providers Set to determine which data points were removed
        // const initialMinusUpdated = difference(initialVerifiedProviders, updatedVerifiedProviders);
        // // Updated providers Set minus initial providers Set to determine which data points were added
        // const updatedMinusInitial = difference(updatedVerifiedProviders, initialVerifiedProviders);
        // // reset can submit state
        // setCanSubmit(false);

        // const verificationStatus = getVerificationStatus(
        //   updatedVerifiedProviders,
        //   initialMinusUpdated,
        //   updatedMinusInitial
        // );

        // if (verificationStatus === VerificationStatuses.Failed && platform.isEVM) {
        //   setShowNoStampModal(true);
        // }

        // // Get the done toast messages
        // const { title, body, icon, platformId } = getDoneToastMessages(
        //   verificationStatus,
        //   updatedVerifiedProviders,
        //   initialMinusUpdated,
        //   updatedMinusInitial
        // );

        // // Display done toast
        // doneToast(title, body, icon, platformId);

        // setLoading(false);
      } catch (e) {
        datadogLogs.logger.error("Verification Error", { error: e, platform: platform.platformId });
        throw e;
      } finally {
        setLoading(false);
      }
    }
  };

  console.log({ additionalSigner });
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
      setVerifiedPlatforms(verifiedPlatforms);
    };
    fetchPlatforms();
  }, [allPlatforms, additionalSigner]);

  if (activePlatform) {
    const allAdded = providerIds.length === selectedProviders.length;
    const platform = getPlatformSpec(activePlatform.platformProps.platform.path);
    return (
      <>
        <PlatformDetails currentPlatform={platform!} />
        <div className="mb-2 w-full">
          <div className="flex w-full justify-between">
            <p className="mb-1 text-left text-sm font-semibold text-gray-600">Accounts</p>
            <a
              className={`cursor-pointer text-sm ${allAdded ? "text-gray-600" : "text-purple-connectPurple"}`}
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
        <button className="sidebar-verify-btn mx-auto flex justify-center" onClick={handleFetchCredential}>
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
      <div className="rounded-full bg-gray-200 p-4">
        <img src="./assets/check-icon-grey.svg" alt="Check Icon" />
      </div>
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
          {verifiedPlatforms.map((verifiedPlatform: PossibleEVMProvider) => {
            const platform = getPlatformSpec(verifiedPlatform.platformProps.platform.path);
            if (platform) {
              return (
                <>
                  <div key={platform.name} className="flex w-full justify-between">
                    <div className="flex">
                      <img width="25px" alt="Platform Image" src={platform?.icon} className="m-3" />
                      <p className="pt-2 text-sm font-semibold">{platform.name}</p>
                    </div>
                    <Button mt={2} onClick={() => setActivePlatform(verifiedPlatform)}>
                      <img width="20px" alt="Plus Icon" src="./assets/plus-icon.svg" />
                      Add
                    </Button>
                  </div>
                  <hr className="border-1" />
                </>
              );
            }
          })}
        </div>
      </div>
    </>
  );
};
