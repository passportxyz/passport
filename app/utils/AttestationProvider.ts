import onchainInfo from "../../deployments/onchainInfo.json";
import GitcoinVerifierAbi from "../../deployments/abi/GitcoinVerifier.json";

type AttestationProviderStatus = "enabled" | "comingSoon" | "disabled";

type BaseProviderConfig = {
  name: string;
  status: AttestationProviderStatus;
  // Only for testing/rollout
  overrideVerifierAddress?: string;
};

type EASConfig = BaseProviderConfig & {
  name: "Ethereum Attestation Service";
  easScanUrl: string;
};

type VeraxConfig = BaseProviderConfig & {
  name: "Verax";
};

export type AttestationProviderConfig = EASConfig | VeraxConfig;

export interface AttestationProvider {
  name: string;
  status: AttestationProviderStatus;
  hasWebViewer: boolean;
  viewerUrl: (address: string) => string;
  verifierAddress: () => string;
  verifierAbi: () => any;
}

class BaseAttestationProvider implements AttestationProvider {
  name = "Override this class";
  status: AttestationProviderStatus;
  hasWebViewer = false;
  overrideVerifierAddress?: string;
  chainId: string;

  constructor({
    chainId,
    status,
    overrideVerifierAddress,
  }: {
    chainId: string;
    status: AttestationProviderStatus;
    overrideVerifierAddress?: string;
  }) {
    this.chainId = chainId;
    this.status = status;
    this.overrideVerifierAddress = overrideVerifierAddress;
  }

  viewerUrl(_address: string): string {
    throw new Error("No viewer, check hasWebViewer first");
  }

  onchainInfo(): any {
    if (!Object.keys(onchainInfo).includes(this.chainId)) {
      throw new Error(`No onchainInfo found for chainId ${this.chainId}`);
    }
    return onchainInfo[this.chainId as keyof typeof onchainInfo];
  }

  verifierAddress(): string {
    return this.overrideVerifierAddress || this.onchainInfo().GitcoinVerifier.address;
  }

  verifierAbi(): any {
    return GitcoinVerifierAbi[this.chainId as keyof typeof GitcoinVerifierAbi];
  }
}

export class EASAttestationProvider extends BaseAttestationProvider {
  name = "Ethereum Attestation Service";
  hasWebViewer = true;
  easScanUrl: string;

  constructor({
    chainId,
    status,
    easScanUrl,
    overrideVerifierAddress,
  }: {
    chainId: string;
    status: AttestationProviderStatus;
    overrideVerifierAddress?: string;
    easScanUrl: string;
  }) {
    super({ status, overrideVerifierAddress, chainId });
    this.easScanUrl = easScanUrl;
  }

  viewerUrl(address: string): string {
    return `${this.easScanUrl}/address/${address}`;
  }
}

export class VeraxAttestationProvider extends BaseAttestationProvider {
  name = "Verax";
}
