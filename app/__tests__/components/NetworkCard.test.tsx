import React from "react";
import { vi, describe, it, expect } from "vitest";
import { screen, waitFor } from "@testing-library/react";

import { NetworkCard } from "../../components/NetworkCard";

import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";

import { CeramicContextState } from "../../context/ceramicContext";
import { Drawer, DrawerOverlay } from "@chakra-ui/react";

import { useOnChainData } from "../../hooks/useOnChainData";
import { Chain } from "../../utils/chains";
import { useOnChainStatus } from "../../hooks/useOnChainStatus";
import { OnChainStatus } from "../../utils/onChainStatus";

vi.mock("../../hooks/useOnChainData");
vi.mock("../../hooks/useOnChainStatus", async (importActual) => {
  const actual = (await importActual()) as any;
  return {
    ...actual,
    useOnChainStatus: vi.fn().mockImplementation(() => ({ isPending: false, status: OnChainStatus.NOT_MOVED })),
  };
});

const mockUseOnChainData = vi.mocked(useOnChainData);
const mockUseOnChainStatus = vi.mocked(useOnChainStatus);

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: { filter: "" },
  }),
}));

const chain = new Chain({
  id: "0xa",
  token: "SEP",
  label: "Sepolia Testnet",
  explorerUrl: "http://www.sepolia.com",
  chainLink: "http://www.sepolia.com",
  icon: "sepolia.svg",
  attestationProviderConfig: {
    name: "Ethereum Attestation Service",
    status: "enabled",
    easScanUrl: "https://optimism-sepolia.easscan.org",
    skipByDefault: false,
    monochromeIcon: "sepolia-mono.svg",
  },
});
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

const defaultUseOnChainData = {
  data: {},
  activeChainProviders: [],
  isPending: false,
  refresh: vi.fn(),
};

describe("OnChainSidebar", () => {
  it("shows Expired for expired attestations", () => {
    mockUseOnChainData.mockReturnValue({
      ...defaultUseOnChainData,
      data: {
        12345: {
          expirationDate: new Date("2021-01-01"),
          score: 0,
          providers: [
            {
              providerName: "NFT",
              expirationDate: new Date("2021-01-01"),
              issuanceDate: new Date("2021-01-01"),
            },
          ],
        },
      },
    });
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <NetworkCard key={4} chain={chain} />
      </Drawer>
    );
    renderWithContext(mockCeramicContext, drawer());
    expect(screen.getByText("Sepolia Testnet")).toBeInTheDocument();
    waitFor(() => expect(screen.getByText("Expired")).toBeInTheDocument());
  });

  it("shows Expiration date for non-expired attestations", () => {
    mockUseOnChainData.mockReturnValue({
      ...defaultUseOnChainData,
      data: {
        12345: {
          expirationDate: new Date("2099-02-04"),
          score: 0,
          providers: [
            {
              providerName: "NFT",
              expirationDate: new Date("2021-01-01"),
              issuanceDate: new Date("2021-01-01"),
            },
          ],
        },
      },
    });
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <NetworkCard key={4} chain={chain} />
      </Drawer>
    );
    renderWithContext(mockCeramicContext, drawer());
    waitFor(() => expect(screen.getByText("Expires")).toBeInTheDocument());
    waitFor(() => expect(screen.getByText("Feb 4, 2099")).toBeInTheDocument());
  });

  it("shows hides mint button if stamp is moved and not expired", () => {
    mockUseOnChainData.mockReturnValue({
      ...defaultUseOnChainData,
      data: {
        12345: {
          expirationDate: new Date("2099-02-04"),
          score: 0,
          providers: [
            {
              providerName: "NFT",
              expirationDate: new Date("2021-01-01"),
              issuanceDate: new Date("2021-01-01"),
            },
          ],
        },
      },
    });
    mockUseOnChainStatus.mockReturnValue({
      isPending: false,
      status: OnChainStatus.NOT_MOVED,
    });
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <NetworkCard key={4} chain={chain} />
      </Drawer>
    );
    renderWithContext(mockCeramicContext, drawer());
    waitFor(() => expect(screen.getByText("Expires")).toBeInTheDocument());
    waitFor(() => expect(screen.getByTestId("sync-to-chain-button")).not.toBeVisible());
  });

  it("hides expiration date UI for expired attestations", () => {
    mockUseOnChainData.mockReturnValue({
      ...defaultUseOnChainData,
      data: {
        12345: {
          expirationDate: new Date("2021-01-01"), // Expired date
          score: 0,
          providers: [
            {
              providerName: "NFT",
              expirationDate: new Date("2021-01-01"),
              issuanceDate: new Date("2021-01-01"),
            },
          ],
        },
      },
    });
    mockUseOnChainStatus.mockReturnValue({
      isPending: false,
      status: OnChainStatus.MOVED_EXPIRED,
    });
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <NetworkCard key={4} chain={chain} />
      </Drawer>
    );
    renderWithContext(mockCeramicContext, drawer());

    // Should show "Expired" label
    waitFor(() => expect(screen.getByText("Expired")).toBeInTheDocument());

    // Should NOT show "Valid for" text (expiration date UI should be hidden)
    expect(screen.queryByText("Valid for")).not.toBeInTheDocument();
  });
});
