import React from "react";
import { screen } from "@testing-library/react";

import { NetworkCard } from "../../components/NetworkCard";
import { checkOnChainStatus, OnChainStatus } from "../../hooks/useOnChainStatus";

import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";

import { UserContextState } from "../../context/userContext";
import { CeramicContextState, AllProvidersState, ProviderState } from "../../context/ceramicContext";
import { OnChainProviderType } from "../../context/onChainContext";
import { Drawer, DrawerOverlay } from "@chakra-ui/react";

jest.mock("../../utils/onboard.ts");

jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { filter: "" },
  }),
}));

const chains = [
  {
    id: "12345",
    token: "SEP",
    label: "Sepolia Testnet",
    rpcUrl: "http://www.sepolia.com",
    icon: "sepolia.svg",
  },
  {
    id: "67899",
    token: "ETH",
    label: "Ethereum Testnet",
    rpcUrl: "http://www.etherum.com",
    icon: "ethereum.svg",
  },
];

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("OnChainSidebar", () => {
  it("renders", () => {
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <NetworkCard key={4} chain={chains[0]} activeChains={[chains[0].id, chains[1].id]} />
      </Drawer>
    );
    renderWithContext(mockUserContext, mockCeramicContext, drawer());
    expect(screen.getByText("Sepolia Testnet")).toBeInTheDocument();
  });
});

describe("checkOnChainStatus", () => {
  const issuanceDate0 = new Date();
  const expirationDate0 = new Date();
  const issuanceDate1 = new Date();
  const expirationDate1 = new Date();

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

  it("should return NOT_MOVED when onChainProviders is an empty array", () => {
    expect(checkOnChainStatus(mockAllProvidersState, [], onChainScore, "DONE", onChainScore)).toBe(
      OnChainStatus.NOT_MOVED
    );
  });

  it("should return MOVED_UP_TO_DATE when onChainProviders matches with allProvidersState", () => {
    expect(checkOnChainStatus(mockAllProvidersState, mockOnChainProviders, onChainScore, "DONE", onChainScore)).toBe(
      OnChainStatus.MOVED_UP_TO_DATE
    );
  });

  it("should return MOVED_OUT_OF_DATE when score does not match", () => {
    expect(
      checkOnChainStatus(mockAllProvidersState, mockOnChainProviders, onChainScore + 1, "DONE", onChainScore)
    ).toBe(OnChainStatus.MOVED_OUT_OF_DATE);
  });

  it("should return MOVED_OUT_OF_DATE when there are differences between onChainProviders and allProvidersState", () => {
    const diffMockAllProviderState: AllProvidersState = {
      ...mockAllProvidersState,
      ["Github"]: {
        stamp: {
          provider: "Github",
          credential: {
            credentialSubject: {
              hash: "hash2",
            },
          },
        },
      } as unknown as ProviderState,
    };
    expect(checkOnChainStatus(diffMockAllProviderState, mockOnChainProviders, onChainScore, "DONE", onChainScore)).toBe(
      OnChainStatus.MOVED_OUT_OF_DATE
    );
  });
});
