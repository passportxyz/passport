// --- React Methods
import { platform } from "os";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { CeramicContext } from "../context/ceramicContext";
import { AdditionalSignature } from "../signer/utils";
import { PlatformClass } from "@gitcoin/passport-platforms";
import { PlatformGroupSpec, Platform, PROVIDER_ID, PLATFORM_ID } from "@gitcoin/passport-platforms/dist/commonjs/types";
import { fetchPossibleEVMStamps } from "../signer/utils";

export const AdditionalStamps = ({ additionalSigner }: { additionalSigner: AdditionalSignature }) => {
  const { allPlatforms } = useContext(CeramicContext);
  const [evmProviders, setEvmProviders] = useState<string[]>([]);

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

    // Flatten platformGroupSpec to a list of all provider names
    const providerNames = platformGroupSpec.reduce((acc, cur) => {
      return [...acc, ...cur.providers.map((provider) => provider.name)];
    }, [] as string[]);
    setEvmProviders(providerNames);
  }, [allPlatforms]);

  useEffect(() => {
    const checkAdditionalSigners = async () => {
      const possibleStamps = await fetchPossibleEVMStamps(additionalSigner.addr, evmProviders);
      console.log({ possibleStamps });
    };
    checkAdditionalSigners();
  });

  const evmStamps = [];
  useEffect(() => {
    if (additionalSigner.addr) {
    }
  }, [additionalSigner]);
  return <div>Stamp Verification</div>;
};
