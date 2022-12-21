// --- React Methods
import { platform } from "os";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { AdditionalSignature } from "../signer/utils";
import { PlatformClass } from "@gitcoin/passport-platforms";
import { PlatformGroupSpec, Platform, PROVIDER_ID, PLATFORM_ID } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { Provider } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { checkAllEVMProviders } from "@gitcoin/passport-platforms";

// export type RequestPayload = {
//   type: string;
//   types?: string[];
//   address: string;
//   version: string;
//   proofs?: {
//     [k: string]: string;
//   };
//   signer?: {
//     challenge: VerifiableCredential;
//     signature: string;
//     address: string;
//   };
//   jsonRpcSigner?: JsonRpcSigner;
//   challenge?: string;
//   issuer?: string;
//   rpcUrl?: string;
// };

export const AdditionalStamps = ({ additionalSigner }: { additionalSigner: AdditionalSignature }) => {
  const { allPlatforms } = useContext(CeramicContext);
  const [evmPlatforms, setEvmPlatforms] = useState<PlatformClass[]>([]);

  useEffect(() => {
    // const platforms: PlatformClass[] = [];
    const platformGroupSpec: PlatformGroupSpec[] = [];
    allPlatforms.forEach((value, key, map) => {
      const platformProp = map.get(key);
      if (platformProp?.platform.isEVM) {
        // platforms.push(platformProp.platform);
        platformGroupSpec.push(...platformProp.platFormGroupSpec);
      }
    });
    console.log({ platformGroupSpec });

    // Get all provider types

    console.log("platformGroupSpec", platformGroupSpec);
    // setEvmPlatforms(platforms);
    console.log("evmPlatforms", evmPlatforms);
  }, [allPlatforms]);

  useEffect(() => {
    const checkAdditionalSigners = async () => {
      // const additionalProviders = await checkAllEVMProviders({
      //   signer: additionalSigner,
      // });
    };
  });

  const evmStamps = [];
  useEffect(() => {
    if (additionalSigner.addr) {
    }
  }, [additionalSigner]);
  return <div>Stamp Verification</div>;
};
