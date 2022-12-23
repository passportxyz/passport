// --- React Methods
import React, { useContext, useEffect, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { AdditionalSignature } from "../signer/utils";
import { PlatformGroupSpec } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { fetchPossibleEVMStamps, PossibleEVMProvider } from "../signer/utils";
import { getPlatformSpec, PlatformSpec } from "../config/platforms";
import { Button } from "@chakra-ui/react";
import { StampSelector } from "./StampSelector";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformDetails } from "./PlatformDetails";

export const AdditionalStampModal = ({ additionalSigner }: { additionalSigner: AdditionalSignature }) => {
  const { allPlatforms } = useContext(CeramicContext);
  const [verifiedPlatforms, setVerifiedPlatforms] = useState<PossibleEVMProvider[]>([]);
  const [activePlatform, setActivePlatform] = useState<PossibleEVMProvider | null>(null);

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
