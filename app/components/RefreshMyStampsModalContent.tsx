// --- React & ReactDOM hooks
import { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";

// --- Types
import { PlatformGroupSpec, PROVIDER_ID, PLATFORM_ID } from "@gitcoin/passport-platforms/dist/commonjs/types";

// --- Identity tools
import { Stamp, VerifiableCredential, VerifiableCredentialRecord } from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- Contexts
import { UserContext } from "../context/userContext";
import { CeramicContext } from "../context/ceramicContext";

// --- Datadog
import { datadogLogs } from "@datadog/browser-logs";

// --- UI components
// TODO: re-add toasts after design updates
import { Spinner, Checkbox } from "@chakra-ui/react";
import { XMarkIcon } from "@heroicons/react/20/solid";

// --- App components
import { RefreshMyStampsModalContentCardList } from "../components/RefreshMyStampsModalContentCardList";
import { reduceStampResponse } from "../utils/helpers";
import { ValidatedPlatform } from "../signer/utils";

const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";

export type RefreshMyStampsModalContentProps = {
  resetStampsAndProgressState: () => void;
  onClose: () => void;
  validPlatforms: ValidatedPlatform[];
};

export type evmPlatformProvider = {
  checked: boolean;
  platformId: PLATFORM_ID;
  platformGroup: PlatformGroupSpec[];
};

export const RefreshMyStampsModalContent = ({
  onClose,
  validPlatforms,
  resetStampsAndProgressState,
}: RefreshMyStampsModalContentProps): JSX.Element => {
  const { address, signer } = useContext(UserContext);
  const { handleAddStamps, handleDeleteStamps } = useContext(CeramicContext);
  const [isLoading, setLoading] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [showDataInfo, setShowDataInfo] = useState(false);
  const [disableOnboard, setDisplayOnboard] = useState(false);
  const navigate = useNavigate();

  // TODO: update comments
  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [verifiedProviders, setVerifiedProviders] = useState<PROVIDER_ID[]>([]);

  // TODO: update comments
  // SelectedProviders will be passed in to the sidebar to be filled there...
  const [selectedProviders, setSelectedProviders] = useState<PROVIDER_ID[]>([...verifiedProviders]);

  useEffect(() => {
    if (selectedProviders.length !== 0) {
      setCanSubmit(true);
    } else {
      setCanSubmit(false);
    }
  });

  const handleRefreshSelectedStamps = async () => {
    try {
      setLoading(true);
      await handleFetchCredential(selectedProviders);
      datadogLogs.logger.info("Successfully saved Stamp, onboard one step verification", {
        providers: selectedProviders,
      });
    } catch (e) {
      datadogLogs.logger.error("Verification Error, onboard one step verification", { error: e });
    }
    setLoading(false);
    navigate("/dashboard");
    resetStampsAndProgressState();
  };

  const handleFetchCredential = async (providerIDs: PROVIDER_ID[]): Promise<void> => {
    try {
      if (selectedProviders.length > 0) {
        const verified: VerifiableCredentialRecord = await fetchVerifiableCredential(
          iamUrl,
          {
            type: "EVMBulkVerify",
            types: selectedProviders,
            version: "0.0.0",
            address: address || "",
            proofs: {},
          },
          signer as { signMessage: (message: string) => Promise<string> }
        );

        const vcs = reduceStampResponse(selectedProviders, verified.credentials);

        // Delete all stamps ...
        await handleDeleteStamps(providerIDs as PROVIDER_ID[]);

        // .. and now add all newly validate stamps
        if (vcs.length > 0) {
          await handleAddStamps(vcs);
        }

        // grab all providers who are verified from the verify response
        const actualVerifiedProviders = providerIDs.filter(
          (providerId) =>
            !!vcs.find((vc: Stamp | undefined) => vc?.credential?.credentialSubject?.provider === providerId)
        );
        // both verified and selected should look the same after save
        setVerifiedProviders([...actualVerifiedProviders]);
        setSelectedProviders([...actualVerifiedProviders]);
      }

      // TODO: re-add toasts after design updates
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
    } catch (e: unknown) {
      // TODO: update datadog logger
      // datadogLogs.logger.error("Verification Error", { error: e, platform: platform.platformId });
      console.log(e);
      throw new Error();
      // doneToast(
      //   "Verification Failed",
      //   "There was an error verifying your stamp. Please try again.",
      //   "../../assets/verification-failed.svg",
      //   platform.platformId as PLATFORM_ID
      // );
    }
  };

  useEffect(() => {
    const providerNames: string[] = validPlatforms
      .map(({ groups }) => groups.map(({ providers }) => providers.map(({ name }) => name)))
      .flat(3);

    setSelectedProviders(providerNames as PROVIDER_ID[]);
  }, [validPlatforms]);

  return (
    <div className="flex grow flex-col">
      <div className="grow">
        {validPlatforms.length > 0 ? (
          <div className="flex flex-col text-white">
            <div className="mb-6 text-2xl">Stamps Found</div>
            <div>
              {" "}
              {/* TODO: update comments */}
              {/* container for platforms so user can scroll if they have a lot */}
              <RefreshMyStampsModalContentCardList
                selectedProviders={selectedProviders}
                validPlatforms={validPlatforms}
                setSelectedProviders={setSelectedProviders}
              />
            </div>
            <div className="mt-8 cursor-pointer text-center text-pink-300 underline">
              <a onClick={() => setShowDataInfo(!showDataInfo)}>How is my data stored?</a>
            </div>
            {showDataInfo && (
              <div className="pt-3 text-justify">
                <p>
                  The only information in your passport is the Decentralized Identifier (DID) associated with your
                  Ethereum address and the Verifiable Credentials (VCs) issued for each service you connect to your
                  passport. No identifiable details are stored in your passport as we encrypt the account details when
                  creating your VCs. You can inspect the data yourself in the Gitcoin Passport by clicking the &lt;/&gt;
                  Passport JSON button in the upper right of the Passport dashboard.
                </p>
              </div>
            )}
            <div className="mt-16 mb-auto flex items-center justify-center">
              <button className="secondary-btn mr-2 w-full rounded-sm py-2 px-6" onClick={() => navigate("/dashboard")}>
                Cancel
              </button>
              <button
                className="ml-2 flex w-full items-center justify-center rounded-sm bg-accent py-2 px-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-black"
                onClick={() => {
                  handleRefreshSelectedStamps();
                }}
                disabled={!canSubmit || isLoading}
              >
                <span className="flex">
                  Confirm Stamps {isLoading && <Spinner size="sm" className="my-auto ml-2" />}
                </span>
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col content-end text-white">
            <button
              className="mt-4 mb-6 flex h-10 w-10 items-center justify-center self-center rounded-full border border-accent-2"
              onClick={onClose}
            >
              <XMarkIcon className="h-7 w-7" aria-hidden="true" />
            </button>
            <div className="text-center">
              <div className="m-auto mb-6 w-3/4 text-3xl">No New Web3 Stamps Detected</div>
              <div className="mt-24 text-xl text-muted">
                We did not find any new Web3 stamps to add to your passport. Completing the actions for a web3 stamp and 
                resubmitting will ensure that stamp is added (for example: Obtain an ENS name, NFT, etc.). Please return to the dashboard 
                and select additional stamps to verify your unique humanity by connecting to external accounts (for example: Gmail, Discord, etc). 
              </div>
            </div>
            <button
              className="sidebar-verify-btn hover:backround-2 mt-36 mb-8 flex w-full items-center justify-center rounded-sm text-white"
              onClick={() => {
                navigate("/dashboard");
                resetStampsAndProgressState();
              }}
            >
              Explore Stamps
            </button>
          </div>
        )}
      </div>
      <div className="mt-6 mb-2 text-color-1">
        <Checkbox
          type="checkbox"
          colorScheme="purple"
          data-testid="checkbox-onboard-hide"
          isChecked={disableOnboard}
          size="md"
          onChange={(e) => {
            if (e.target.checked) {
              const now = Math.floor(Date.now() / 1000);
              localStorage.setItem("onboardTS", now.toString());
              setDisplayOnboard(true);
            } else {
              localStorage.removeItem("onboardTS");
              setDisplayOnboard(false);
            }
          }}
        >
          Skip welcome onboarding until stamps expire
        </Checkbox>
      </div>
    </div>
  );
};
