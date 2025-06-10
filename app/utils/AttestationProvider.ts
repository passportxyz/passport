import onchainInfo from "../../deployments/onchainInfo.json";
import GitcoinVerifierAbi from "../../deployments/abi/GitcoinVerifier.json";
import axios, { AxiosResponse } from "axios";
import { iamUrl } from "../config/stamp_config";
import { OnChainStatus } from "../utils/onChainStatus";
import { ScoreState } from "../context/scorerContext";
import { AllProvidersState, ProviderState } from "../context/ceramicContext";
import { OnChainProviderType } from "../hooks/useOnChainData";
import { Stamp } from "@gitcoin/passport-types";

type ProviderWithStamp = ProviderState & { stamp: Stamp };

type AttestationProviderStatus = "enabled" | "comingSoon" | "disabled";

type BaseProviderConfig = {
  name: string;
  status: AttestationProviderStatus;
  skipByDefault: boolean; // If true, only show this chain if explicitly listed in the chain list
  monochromeIcon: string;
};

type EASConfig = BaseProviderConfig & {
  name: "Ethereum Attestation Service";
  easScanUrl?: string;
};

type VeraxAndEASConfig = BaseProviderConfig & {
  name: "Verax + EAS";
  easScanUrl?: string;
};

export type AttestationProviderConfig = EASConfig | VeraxAndEASConfig;

export interface AttestationProvider {
  name: string;
  status: AttestationProviderStatus;
  skipByDefault: boolean;
  hasWebViewer: boolean;
  attestationExplorerLinkText: string;
  monochromeIcon: string;
  viewerUrl: (address: string) => string;
  verifierAddress: () => string;
  verifierAbi: () => any;
  getMultiAttestationRequest: (payload: {}) => Promise<AxiosResponse<any, any>>;
  checkOnChainStatus: (
    allProvidersState: AllProvidersState,
    onChainProviders: OnChainProviderType[],
    rawScore: number,
    scoreState: ScoreState,
    onChainScore: number,
    expirationDate?: Date
  ) => OnChainStatus;
}

export const jsonRequest = (url: string, payload: any) =>
  axios.post(url, payload, {
    headers: {
      "Content-Type": "application/json",
    },
    transformRequest: [(data: any) => JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v))],
  });

class BaseAttestationProvider implements AttestationProvider {
  name = "Override this class";
  status: AttestationProviderStatus;
  skipByDefault: boolean = false;
  hasWebViewer = false;
  attestationExplorerLinkText = "Check attestation on EAS";
  chainId: string;
  monochromeIcon: string;

  constructor({
    chainId,
    status,
    monochromeIcon,
    skipByDefault = false,
  }: {
    chainId: string;
    status: AttestationProviderStatus;
    monochromeIcon: string;
    skipByDefault: boolean;
  }) {
    this.chainId = chainId;
    this.status = status;
    this.monochromeIcon = monochromeIcon;
    this.skipByDefault = skipByDefault;
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

  async getMultiAttestationRequest(payload: {}): Promise<AxiosResponse<any, any>> {
    const url = `${iamUrl}v0.0.0/eas/scoreV2`;
    return jsonRequest(url, payload);
  }

  checkOnChainStatus(
    allProvidersState: AllProvidersState,
    onChainProviders: OnChainProviderType[],
    rawScore: number,
    scoreState: ScoreState,
    onChainScore: number,
    expirationDate?: Date
  ): OnChainStatus {
    // This is default implementation that will check for differences in
    // the on-chain providers and on-chain score
    if (scoreState.status === "loading") return OnChainStatus.LOADING;

    if (onChainProviders.length === 0) return OnChainStatus.NOT_MOVED;

    if (expirationDate && new Date() > expirationDate) return OnChainStatus.MOVED_EXPIRED;

    if (rawScore !== onChainScore) return OnChainStatus.MOVED_OUT_OF_DATE;

    const verifiedDbProviders: ProviderWithStamp[] = Object.values(allProvidersState).filter(
      (provider): provider is ProviderWithStamp => provider?.stamp !== undefined
    );

    const equivalentProviders = verifiedDbProviders.reduce((eq, provider) => {
      if (onChainProviders.some((onChainProvider) => onChainProvider.providerName === provider.stamp.provider)) {
        eq.add(provider.stamp.provider);
      }
      return eq;
    }, new Set<string>());

    const dbProviderNames = new Set(
      verifiedDbProviders
        // Ignore offchain expired credentials
        .filter((provider) => new Date(provider.stamp.credential.expirationDate) > new Date())
        .map((provider) => provider.stamp.provider)
    );

    const hasDbOnlyProviders = Array.from(dbProviderNames).some((provider) => !equivalentProviders.has(provider));

    const onchainProviderNames = new Set(onChainProviders.map((provider) => provider.providerName));

    const hasOnchainOnlyProviders = Array.from(onchainProviderNames).some(
      (provider) => !equivalentProviders.has(provider)
    );

    return equivalentProviders.size === onChainProviders.length && !hasDbOnlyProviders && !hasOnchainOnlyProviders
      ? OnChainStatus.MOVED_UP_TO_DATE
      : OnChainStatus.MOVED_OUT_OF_DATE;
  }
}

export class EASAttestationProvider extends BaseAttestationProvider {
  name = "Ethereum Attestation Service (Score & Passport)";
  hasWebViewer = true;
  easScanUrl?: string;

  constructor({
    chainId,
    status,
    easScanUrl,
    monochromeIcon,
    skipByDefault = false,
  }: {
    chainId: string;
    status: AttestationProviderStatus;
    easScanUrl?: string;
    monochromeIcon: string;
    skipByDefault: boolean;
  }) {
    super({ status, chainId, monochromeIcon, skipByDefault });
    this.easScanUrl = easScanUrl;
    this.hasWebViewer = !!easScanUrl;
  }

  viewerUrl(address: string): string {
    return `${this.easScanUrl}/address/${address}`;
  }
}

export class VeraxAndEASAttestationProvider extends EASAttestationProvider {
  name = "Verax, Ethereum Attestation Service";
  attestationExplorerLinkText = "Check attestation on Verax";

  viewerUrl(address: string): string {
    return this.easScanUrl || "";
  }
}
