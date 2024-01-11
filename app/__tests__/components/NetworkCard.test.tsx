import React from "react";
import { screen } from "@testing-library/react";

import { NetworkCard } from "../../components/NetworkCard";

import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";

import { CeramicContextState } from "../../context/ceramicContext";
import { Drawer, DrawerOverlay } from "@chakra-ui/react";

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

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("OnChainSidebar", () => {
  it("renders", () => {
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <NetworkCard key={4} chain={chains[0]} />
      </Drawer>
    );
    renderWithContext(mockCeramicContext, drawer());
    expect(screen.getByText("Sepolia Testnet")).toBeInTheDocument();
  });
});
