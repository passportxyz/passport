import { useState, useEffect, useContext } from "react";

import { useToast } from "@chakra-ui/react";

// --- Types
import { PlatformGroupSpec, Platform, PROVIDER_ID, PLATFORM_ID } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { PlatformProps } from "../components/GenericPlatform";
import { PlatformClass } from "@gitcoin/passport-platforms";
import { getPlatformSpec } from "@gitcoin/passport-platforms/dist/commonjs/platforms-config";

// --- Identity tools
import {
  Stamp,
  VerifiableCredential,
  CredentialResponseBody,
  VerifiableCredentialRecord,
} from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

import { UserContext } from "../context/userContext";
import { CeramicContext } from "../context/ceramicContext";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";

// --- Utils
import { PossibleEVMProvider } from "../signer/utils";

import { RefreshMyStampsModalContentCardList } from "../components/RefreshMyStampsModalContentCardList";
import { platform } from "os";

const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";
const rpcUrl = process.env.NEXT_PUBLIC_PASSPORT_MAINNET_RPC_URL;

export type RefreshMyStampsModalContentProps = {
  // isOpen: boolean;
  onClose: () => void;
  fetchedPossibleEVMStamps: PossibleEVMProvider[] | undefined;
};

export type evmPlatformProvider = {
  checked: boolean;
  platformId: PLATFORM_ID;
  platformGroup: PlatformGroupSpec[];
};

export const RefreshMyStampsModalContent = ({
  onClose,
  fetchedPossibleEVMStamps,
}: RefreshMyStampsModalContentProps): JSX.Element => {
  const { address, signer } = useContext(UserContext);
  const { handleAddStamps, handleDeleteStamps, allProvidersState, userDid, allPlatforms } = useContext(CeramicContext);
  const [isLoading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [possiblyVerifiedPlatforms, setPossiblyVerifiedPlatforms] = useState<PossibleEVMProvider[]>([]);
  const [platformsLoading, setPlatformsLoading] = useState(false);
  const [activePlatform, setActivePlatform] = useState<PossibleEVMProvider | null>(null);
  const [selectedEVMPlatformProviders, setSelectedEVMPlatformProviders] = useState<evmPlatformProvider[]>([]);
  // const [switchState, setSwitchState] = useState<>({
  //   checked: false,
  //   platformId: "" as PLATFORM_ID,
  //   platformGroup: [] as PlatformGroupSpec[],
  // });

  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [verifiedProviders, setVerifiedProviders] = useState<PROVIDER_ID[]>([]);

  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [selectedProviders, setSelectedProviders] = useState<PROVIDER_ID[]>([...verifiedProviders]);

  // const providerIds =
  //   activePlatform?.platformProps.platFormGroupSpec?.reduce((all, stamp, i) => {
  //     return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
  //   }, [] as PROVIDER_ID[]) || [];

  const handleRefreshSelectedStamps = async () => {
    selectedEVMPlatformProviders?.map((platformProviders) => {
      const platformId = platformProviders.platformId;
      const providerIds =
        platformProviders.platformGroup.reduce((all, stamp, i) => {
          return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
        }, [] as PROVIDER_ID[]) || [];
      console.log("platformId", platformId);
      console.log("providerIds", providerIds);
      handleFetchCredential(platformId, providerIds);
    });
  };

  const handleFetchCredential = async (platformID: PLATFORM_ID, providerIDs: PROVIDER_ID[]): Promise<void> => {
    // FIXME: there should be no activePlatform since handleFetchCredential will be looped and called together for all platforms
    // if (activePlatform) {
    //   const { platform } = activePlatform?.platformProps;
    //   datadogLogs.logger.info("Saving Stamp", { platform: platform.platformId });
    setLoading(true);
    try {
      // This array will contain all providers that new validated VCs
      let vcs: Stamp[] = [];

      if (selectedProviders.length > 0) {
        const verified: VerifiableCredentialRecord = await fetchVerifiableCredential(
          iamUrl,
          {
            type: platformID,
            types: selectedProviders,
            version: "0.0.0",
            address: address || "",
            proofs: {},
            rpcUrl,
          },
          signer as { signMessage: (message: string) => Promise<string> }
        );

        // because we provided a types array in the params we expect to receive a
        // credentials array in the response...
        if (verified.credentials) {
          for (let i = 0; i < verified.credentials.length; i++) {
            let cred = verified.credentials[i];
            if (!cred.error && providerIDs.find((providerId: PROVIDER_ID) => cred?.record?.type === providerId)) {
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
      await handleDeleteStamps(providerIDs as PROVIDER_ID[]);

      // .. and now add all newly validate stamps
      if (vcs.length > 0) {
        await handleAddStamps(vcs);
      }

      // datadogLogs.logger.info("Successfully saved Stamp", { platform: platform.platformId });

      // grab all providers who are verified from the verify response
      const actualVerifiedProviders = providerIDs.filter(
        (providerId) =>
          !!vcs.find((vc: Stamp | undefined) => vc?.credential?.credentialSubject?.provider === providerId)
      );
      // both verified and selected should look the same after save
      setVerifiedProviders([...actualVerifiedProviders]);
      setSelectedProviders([...actualVerifiedProviders]);

      // // Get the done toast messages
      // const { title, body, icon, platformId } = getDoneToastMessages(
      //   verificationStatus,
      //   updatedVerifiedProviders,
      //   initialMinusUpdated,
      //   updatedMinusInitial
      // );

      // // Display done toast
      // doneToast(title, body, icon, platformId);

      setLoading(false);
    } catch (e) {
      // datadogLogs.logger.error("Verification Error", { error: e, platform: platform.platformId });
      console.log("error", e);
      // doneToast(
      //   "Verification Failed",
      //   "There was an error verifying your stamp. Please try again.",
      //   "../../assets/verification-failed.svg",
      //   platform.platformId as PLATFORM_ID
      // );
    } finally {
      setLoading(false);
    }
    // }
  };

  /* TODO: 
  -- when the "Confirm Stamps" button is clicked, 
  -- onClick ---> start a forEach loop and for each of the found platforms, call handleFetchCredential
  ----***check the selectedProviders output to see how we can do this
  -- if the provider is validated those platform cards should say "Verified"
  */
  return (
    <>
      <div className="mb-6 text-2xl text-white">Stamps Found</div>
      <div>
        {" "}
        {/* container for platforms so user can scroll if they have a lot */}
        <RefreshMyStampsModalContentCardList
          verifiedProviders={verifiedProviders}
          selectedProviders={selectedProviders}
          fetchedPossibleEVMStamps={fetchedPossibleEVMStamps}
          selectedEVMPlatformProviders={selectedEVMPlatformProviders}
          setSelectedProviders={setSelectedProviders}
          setSelectedEVMPlatformProviders={setSelectedEVMPlatformProviders}
        />
      </div>
      <div className="text-center text-pink-300 underline">
        <a href="#">How is my data stored?</a>
      </div>
      <div className="mt-16 flex content-center items-center justify-between">
        <button className="secondary-btn mr-2 w-full rounded-sm py-2 px-6" onClick={onClose}>
          Cancel
        </button>
        <button className="ml-2 w-full rounded-sm bg-accent py-2 px-6 text-white" onClick={handleRefreshSelectedStamps}>
          Confirm Stamps
        </button>
      </div>
    </>
  );
};
