import onchainInfo from "../../deployments/onchainInfo.json";
import GitcoinVerifierAbi from "../../deployments/abi/GitcoinVerifier.json";
import axios, { AxiosResponse } from "axios";
import { iamUrl } from "../config/stamp_config";
import { OnChainStatus } from "../utils/onChainStatus";
import { ScoreStateType } from "../context/scorerContext";
import { AllProvidersState, ProviderState } from "../context/ceramicContext";
import { OnChainProviderType } from "../context/onChainContext";
import { Stamp } from "@gitcoin/passport-types";

type ProviderWithStamp = ProviderState & { stamp: Stamp };

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
  attestationExplorerLinkText: string;
  viewerUrl: (address: string) => string;
  verifierAddress: () => string;
  verifierAbi: () => any;
  getMultiAttestationRequest: (payload: {}) => Promise<AxiosResponse<any, any>>;
  checkOnChainStatus: (
    allProvidersState: AllProvidersState,
    onChainProviders: OnChainProviderType[],
    rawScore: number,
    scoreState: ScoreStateType,
    onChainScore: number,
    expirationDate?: Date
  ) => OnChainStatus;
}

class BaseAttestationProvider implements AttestationProvider {
  name = "Override this class";
  status: AttestationProviderStatus;
  hasWebViewer = false;
  attestationExplorerLinkText = "Check attestation on EAS";
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

  async getMultiAttestationRequest(payload: {}): Promise<AxiosResponse<any, any>> {
    return axios.post(`${iamUrl}v0.0.0/eas/passport`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      transformRequest: [(data: any) => JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v))],
    });
  }

  checkOnChainStatus(
    allProvidersState: AllProvidersState,
    onChainProviders: OnChainProviderType[],
    rawScore: number,
    scoreState: ScoreStateType,
    onChainScore: number,
    expirationDate?: Date
  ): OnChainStatus {
    // This is default implementation that will check for differences in
    // the on-chain providers and on-chain score
    if (scoreState !== "DONE") return OnChainStatus.LOADING;

    if (onChainProviders.length === 0) return OnChainStatus.NOT_MOVED;

    if (expirationDate && new Date() > expirationDate) return OnChainStatus.MOVED_EXPIRED;

    if (rawScore !== onChainScore) return OnChainStatus.MOVED_OUT_OF_DATE;

    const verifiedDbProviders: ProviderWithStamp[] = Object.values(allProvidersState).filter(
      (provider): provider is ProviderWithStamp => provider.stamp !== undefined
    );

    const [equivalentProviders, differentProviders] = verifiedDbProviders.reduce(
      ([eq, diff], provider): [ProviderWithStamp[], ProviderWithStamp[]] => {
        const expirationDateSeconds = Math.floor(new Date(provider.stamp.credential.expirationDate).valueOf() / 1000);
        const issuanceDateSeconds = Math.floor(new Date(provider.stamp.credential.issuanceDate).valueOf() / 1000);

        const isEquivalent = onChainProviders.some(
          (onChainProvider) =>
            onChainProvider.providerName === provider.stamp.provider &&
            onChainProvider.credentialHash === provider.stamp.credential.credentialSubject?.hash &&
            Math.floor(onChainProvider.expirationDate.valueOf() / 1000) === expirationDateSeconds &&
            Math.floor(onChainProvider.issuanceDate.valueOf() / 1000) === issuanceDateSeconds
        );
        return isEquivalent ? [[...eq, provider], diff] : [eq, [...diff, provider]];
      },
      [[], []] as [ProviderWithStamp[], ProviderWithStamp[]]
    );

    return equivalentProviders.length === onChainProviders.length && differentProviders.length === 0
      ? OnChainStatus.MOVED_UP_TO_DATE
      : OnChainStatus.MOVED_OUT_OF_DATE;
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
  attestationExplorerLinkText = "Check attestation on Verax";

  async getMultiAttestationRequest(payload: {}): Promise<AxiosResponse<any, any>> {
    return axios.post(`${iamUrl}v0.0.0/eas/score`, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      transformRequest: [(data: any) => JSON.stringify(data, (_k, v) => (typeof v === "bigint" ? v.toString() : v))],
    });
  }

  viewerUrl(address: string): string {
    return this.easScanUrl;
  }

  checkOnChainStatus(
    allProvidersState: AllProvidersState,
    onChainProviders: OnChainProviderType[],
    rawScore: number,
    scoreState: ScoreStateType,
    onChainScore: number,
    expirationDate?: Date
  ): OnChainStatus {
    // This is specific implementation for Verax where we only check for the score to be different
    if (scoreState !== "DONE" || onChainScore === undefined) {
      return OnChainStatus.LOADING;
    }

    if (expirationDate && new Date() > expirationDate) return OnChainStatus.MOVED_EXPIRED;

    if (Number.isNaN(onChainScore)) return OnChainStatus.NOT_MOVED;
    return rawScore !== onChainScore ? OnChainStatus.MOVED_OUT_OF_DATE : OnChainStatus.MOVED_UP_TO_DATE;
  }
}
