import React, { useRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import { SideBarContent, SideBarContentProps } from "../../components/SideBarContent";

import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";

import { UserContextState } from "../../context/userContext";
import { CeramicContextState } from "../../context/ceramicContext";
import { Drawer, DrawerOverlay } from "@chakra-ui/react";

jest.mock("../../utils/onboard.ts");

const props: SideBarContentProps = {
  currentPlatform: {
    icon: "./assets/ensStampIcon.svg",
    platform: "Ens",
    name: "ENS",
    description: "Purchase an .eth name to verify/ connect your existing account.",
    connectMessage: "Connect Account",
    isEVM: true,
  },
  currentProviders: [
    {
      platformGroup: "Account Name",
      providers: [
        {
          title: "Encrypted",
          name: "Ens",
        },
      ],
    },
  ],
  verifiedProviders: [],
  selectedProviders: undefined,
  setSelectedProviders: undefined,
  isLoading: false,
  verifyButton: undefined,
};

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("SideBarContent", () => {
  it("renders", () => {
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <SideBarContent {...props} />
      </Drawer>
    );
    renderWithContext(mockUserContext, mockCeramicContext, drawer());
    expect(screen.getByText("ENS")).toBeInTheDocument();
  });
});
