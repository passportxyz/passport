import React from "react";
import { screen } from "@testing-library/react";

import { NetworkCard, checkOnChainStatus, OnChainStatus } from "../../components/NetworkCard";

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
  const mockAllProvidersState: AllProvidersState = {
    ["Google"]: {
      stamp: {
        provider: "Google",
        credential: {
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
      expirationDate: new Date(),
      issuanceDate: new Date(),
    },
    {
      providerName: "Ens",
      credentialHash: "hash2",
      expirationDate: new Date(),
      issuanceDate: new Date(),
    },
  ];

  it("should return NOT_MOVED when onChainProviders is an empty array", () => {
    expect(checkOnChainStatus(mockAllProvidersState, [])).toBe(OnChainStatus.NOT_MOVED);
  });

  it("should return MOVED_UP_TO_DATE when onChainProviders matches with allProvidersState", () => {
    expect(checkOnChainStatus(mockAllProvidersState, mockOnChainProviders)).toBe(OnChainStatus.MOVED_UP_TO_DATE);
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
    expect(checkOnChainStatus(diffMockAllProviderState, mockOnChainProviders)).toBe(OnChainStatus.MOVED_OUT_OF_DATE);
  });
});
