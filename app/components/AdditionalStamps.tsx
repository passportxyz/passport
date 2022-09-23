// --- React Methods
import React, { useEffect, useState } from "react";
import { AdditionalSignature, EVMStamp, fetchPossibleEVMStamps } from "../signer/utils";
import { VerifiedPayload } from "@gitcoin/passport-types";
import { getPlatformSpec } from "../config/platforms";
import { Button } from "@chakra-ui/react";
import { AddAdditionalStamp } from "./AddAdditionalStamp";

export type AdditionalStampProps = {
  payload: VerifiedPayload;
  type: string;
};

export const AdditionalStamps = ({
  additionalSigner,
  onClose,
}: {
  additionalSigner: AdditionalSignature;
  onClose: () => void;
}) => {
  const [additionalStamps, setAdditionalStamps] = useState<EVMStamp[] | undefined>();
  const [requestedStamp, setRequestedStamp] = useState<EVMStamp | undefined>();

  const checkAdditionalStamps = async (address: string) => {
    const additionalStamps = await fetchPossibleEVMStamps(address);
    setAdditionalStamps(additionalStamps);
  };
  useEffect(() => {
    if (additionalSigner.addr) {
      checkAdditionalStamps(additionalSigner.addr);
    }
  }, [additionalSigner]);

  if (requestedStamp) {
    return (
      <AddAdditionalStamp
        stampAdded={() => setRequestedStamp(undefined)}
        additionalSigner={additionalSigner}
        stamp={requestedStamp}
      />
    );
  }

  return (
    <>
      <div className="flex w-full justify-end">
        <button onClick={onClose} className="float-left p-2">
          <img className="w-4" src="./assets/cross.svg" alt="Back arrow" />
        </button>
      </div>
      <div className="mt-2 w-fit rounded-full bg-gray-100">
        <img className="m-2" alt="shield-exclamation-icon" src="./assets/check-icon.svg" />
      </div>
      <p className="m-1 text-sm font-bold">Stamp Verification</p>
      <p className="m-1 mb-4 text-center">We found the following stamps, select which ones you would like to link.</p>
      <div className="inline-block w-full px-4">
        {additionalStamps?.map((stamp) => {
          if (stamp.payload.valid) {
            const spec = getPlatformSpec(stamp.platformType);
            return (
              <div key={stamp.platformType}>
                <hr />
                <div className="flex w-full justify-between py-2">
                  <div className="flex">
                    <img className="mr-4 w-6" src={spec?.icon} alt={spec?.description} />
                    <div>
                      <p className="font-semi-bold">{spec?.platform}</p>
                      {/* <p>{stamp.payload.record}</p> */}
                    </div>
                  </div>
                  <Button onClick={() => setRequestedStamp(stamp)}>
                    <img src="./assets/plus.svg" alt="Plus Image" className="pr-2" />
                    Add
                  </Button>
                </div>
                <hr />
              </div>
            );
          }
        })}
      </div>
      <button onClick={onClose} data-testid="button-verify-ens" className="sidebar-verify-btn">
        Done
      </button>
    </>
  );
};
