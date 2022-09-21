// --- React Methods
import React, { useContext, useEffect, useState } from "react";
import { AdditionalSignature } from "../signer/utils";

export const AdditionalStamps = ({ additionalSigner }: { additionalSigner: AdditionalSignature }) => {
  useEffect(() => {
    if (additionalSigner.addr) {
    }
  }, [additionalSigner]);
  return <div>Stamp Verification</div>;
};
