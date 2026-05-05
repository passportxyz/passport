import React from "react";
import { PlatformOptions } from "../types.js";
import { BaseHumanIDPlatform } from "../HumanID/shared/BaseHumanIDPlatform.js";
import { getKycSBTByAddress, getZkPassportSBTByAddress } from "@holonym-foundation/human-id-sdk";
import type { KycOptions } from "@holonym-foundation/human-id-interface-core";
import { getZkPassportFreeOffChainAttestation, validateOffChainAttestation } from "../HumanID/shared/utils.js";
import { KYC_CREDENTIAL_TYPE } from "./constants.js";

export class HumanIdKycPlatform extends BaseHumanIDPlatform {
  platformId = "HumanIdKyc";
  path = "HumanIdKyc";
  credentialType = KYC_CREDENTIAL_TYPE;

  // Multi-source: any of three Human ID issuance paths counts as a valid Government ID
  // credential. Order matches the backend provider in HumanIdKyc/Providers/humanIdKyc.ts.
  sbtFetchers = [getKycSBTByAddress, getZkPassportSBTByAddress];

  hasValidOffChainAttestation = async (address: string): Promise<boolean> => {
    const attestation = await getZkPassportFreeOffChainAttestation(address);
    return validateOffChainAttestation(attestation).valid;
  };

  // freeZKPassport is omitted from the public requestSBT type but accepted by
  // privateRequestSBT at runtime — the cast in HumanID/shared/types.ts makes
  // the unrestricted KycOptions reachable.
  kycOptions: KycOptions = {
    regularKYC: true,
    paidZKPassport: true,
    freeZKPassport: true,
  };

  constructor(options: PlatformOptions) {
    super(options);

    this.banner = {
      heading: "To add the Human ID Government ID Stamp to your Passport...",
      content: React.createElement(
        "div",
        {},
        "Connect your wallet and verify your identity privately through Human ID. You can choose Onfido KYC ($5), the paid ZK Passport flow ($3), or the free ZK Passport flow (1-week off-chain attestation)."
      ),
      cta: {
        label: "Learn more",
        url: "https://human.tech",
      },
    };
  }
}
