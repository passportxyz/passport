import onchainInfo from "../../deployments/onchainInfo.json";
import GitcoinVerifierAbi from "../../deployments/abi/GitcoinVerifier.json";

type AttestationProviderStatus = "enabled" | "comingSoon" | "disabled";

type BaseProviderConfig = {
  name: string;
  status: AttestationProviderStatus;
};

type EASConfig = BaseProviderConfig & {
  name: "Ethereum Attestation Service";
  easScanUrl: string;
};

type VeraxAndEASConfig = BaseProviderConfig & {
  name: "Verax + EAS";
  easScanUrl: string;
};

export type AttestationProviderConfig = EASConfig | VeraxAndEASConfig;

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
  chainId: string;

  constructor({ chainId, status }: { chainId: string; status: AttestationProviderStatus }) {
    this.chainId = chainId;
    this.status = status;
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
    return this.onchainInfo().GitcoinVerifier.address;
  }

  verifierAbi(): any {
    return GitcoinVerifierAbi[this.chainId as keyof typeof GitcoinVerifierAbi];
  }
}

export class EASAttestationProvider extends BaseAttestationProvider {
  name = "Ethereum Attestation Service (Score & Passport)";
  hasWebViewer = true;
  easScanUrl: string;

  constructor({
    chainId,
    status,
    easScanUrl,
  }: {
    chainId: string;
    status: AttestationProviderStatus;
    easScanUrl: string;
  }) {
    super({ status, chainId });
    this.easScanUrl = easScanUrl;
  }

  viewerUrl(address: string): string {
    return `${this.easScanUrl}/address/${address}`;
  }
}

export class VeraxAndEASAttestationProvider extends EASAttestationProvider {
  name = "Verax, Ethereum Attestation Service (Score only)";
}
