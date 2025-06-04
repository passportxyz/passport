import { vi, describe, it, expect } from "vitest";
import { OnChainStatus } from "../../utils/onChainStatus";

import { AllProvidersState, ProviderState } from "../../context/ceramicContext";
import { OnChainProviderType } from "../../hooks/useOnChainData";
import { EASAttestationProvider, VeraxAndEASAttestationProvider } from "../../utils/AttestationProvider";

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: { filter: "" },
  }),
}));

const easAttestationProvider = new EASAttestationProvider({
  chainId: "12345",
  status: "enabled",
  easScanUrl: "https://eas.scan.url",
});

const veraxAttestationProvider = new VeraxAndEASAttestationProvider({
  chainId: "12345",
  status: "enabled",
  easScanUrl: "https://eas.scan.url",
});

const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000);
const issuanceDate0 = new Date();
const expirationDate0 = tomorrow;
const issuanceDate1 = new Date();
const expirationDate1 = tomorrow;

const mockAllProvidersState: AllProvidersState = {
  ["Google"]: {
    stamp: {
      provider: "Google",
      credential: {
        expirationDate: expirationDate0,
        issuanceDate: issuanceDate0,
        credentialSubject: {
          hash: "hash1",
        },
      },
    },
  } as unknown as ProviderState,
  ["Ens"]: {
    stamp: {
      provider: "Ens",
      credential: {
        expirationDate: expirationDate1,
        issuanceDate: issuanceDate1,
        credentialSubject: {
          hash: "hash2",
        },
      },
    },
  } as unknown as ProviderState,
};

const mockOnChainProviders: OnChainProviderType[] = [
  {
    providerName: "Google",
    credentialHash: "hash1",
    expirationDate: expirationDate0,
    issuanceDate: issuanceDate0,
  },
  {
    providerName: "Ens",
    credentialHash: "hash2",
    expirationDate: expirationDate1,
    issuanceDate: issuanceDate1,
  },
];

const onChainScore = 10.1;

describe.each([easAttestationProvider, veraxAttestationProvider])("AttestationProviders", (attestationProvider) => {
  describe(`checkOnChainStatus ${attestationProvider.name}`, () => {
    it("should return MOVED_UP_TO_DATE when onChainProviders matches with allProvidersState", () => {
      expect(
        attestationProvider.checkOnChainStatus(
          mockAllProvidersState,
          mockOnChainProviders,
          onChainScore,
          { status: "success" },
          onChainScore
        )
      ).toBe(OnChainStatus.MOVED_UP_TO_DATE);
    });

    it("should return MOVED_OUT_OF_DATE when score does not match", () => {
      expect(
        attestationProvider.checkOnChainStatus(
          mockAllProvidersState,
          mockOnChainProviders,
          onChainScore + 1,
          { status: "success" },
          onChainScore
        )
      ).toBe(OnChainStatus.MOVED_OUT_OF_DATE);
    });

    it("should return MOVED_OUT_OF_DATE when there are differences between onChainProviders and allProvidersState", () => {
      const diffMockAllProviderState: AllProvidersState = {
        ...mockAllProvidersState,
        ["Github"]: {
          stamp: {
            provider: "Github",
            credential: {
              expirationDate: expirationDate0,
              issuanceDate: issuanceDate0,
              credentialSubject: {
                hash: "hash2",
              },
            },
          },
        } as unknown as ProviderState,
      };
      expect(
        attestationProvider.checkOnChainStatus(
          diffMockAllProviderState,
          mockOnChainProviders,
          onChainScore,
          { status: "success" },
          onChainScore
        )
      ).toBe(OnChainStatus.MOVED_OUT_OF_DATE);
    });
  });

  it("should return NOT_MOVED when onChainProviders is an empty array", () => {
    expect(
      attestationProvider.checkOnChainStatus(
        mockAllProvidersState,
        [],
        onChainScore,
        { status: "success" },
        onChainScore
      )
    ).toBe(OnChainStatus.NOT_MOVED);
  });
});
