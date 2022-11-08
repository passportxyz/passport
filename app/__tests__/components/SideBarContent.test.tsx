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
import { PROVIDER_ID } from "@gitcoin/passport-types";

jest.mock("../../utils/onboard.ts");

const verifiedProviders: PROVIDER_ID[] = ["Github", "FiveOrMoreGithubRepos", "ForkedGithubRepoProvider"];
const selectedProviders: PROVIDER_ID[] = ["Github", "FiveOrMoreGithubRepos", "ForkedGithubRepoProvider"];

const props: SideBarContentProps = {
  currentPlatform: {
    icon: "./assets/githubStampIcon.svg",
    platform: "Github",
    name: "Github",
    description: "Connect your existing Github account to verify.",
    connectMessage: "Connect Account",
  },
  currentProviders: [
    { platformGroup: "Account Name", providers: [{ title: "Encrypted", name: "Github" }] },
    {
      platformGroup: "Repositories",
      providers: [
        { title: "Five or more Github repos", name: "FiveOrMoreGithubRepos" },
        { title: "At least 1 Github repo forked by another user", name: "ForkedGithubRepoProvider" },
        { title: "At least 1 Github repo starred by another user", name: "StarredGithubRepoProvider" },
      ],
    },
    {
      platformGroup: "Followers",
      providers: [
        { title: "Ten or more Github followers", name: "TenOrMoreGithubFollowers" },
        { title: "Fifty or more Github followers", name: "FiftyOrMoreGithubFollowers" },
      ],
    },
  ],
  verifiedProviders,
  selectedProviders,
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
    expect(screen.getByText("Github")).toBeInTheDocument();
  });

  it("should mark verified providers with green circle", () => {
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <SideBarContent {...props} />
      </Drawer>
    );
    renderWithContext(mockUserContext, mockCeramicContext, drawer());

    verifiedProviders.forEach((provider) => {
      expect(screen.getByTestId(`indicator-${provider}`)).toHaveClass("text-green-500");
    });
  });

  it("should mark non verified providers with grey circle", () => {
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <SideBarContent {...props} />
      </Drawer>
    );
    renderWithContext(mockUserContext, mockCeramicContext, drawer());

    const allProviders = props.currentProviders
      ?.map((provider) => provider.providers)
      .flat()
      .map((provider) => provider.name);

    const nonVerifiedProviders = allProviders?.filter(
      (provider) => !verifiedProviders.includes(provider as PROVIDER_ID)
    );

    nonVerifiedProviders?.forEach((provider) => {
      expect(screen.getByTestId(`indicator-${provider}`)).toHaveClass("text-gray-400");
    });
  });

  it("should set switches as checked", () => {
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <SideBarContent {...props} />
      </Drawer>
    );
    renderWithContext(mockUserContext, mockCeramicContext, drawer());

    props.currentProviders?.forEach((stamp) => {
      stamp.providers.forEach((provider, i) => {
        if (verifiedProviders.includes(provider.name as PROVIDER_ID)) {
          expect(screen.getByTestId(`switch-${i}`)).toHaveAttribute("data-checked");
        } else {
          expect(screen.getByTestId(`switch-${i}`).attributes).not.toContain("data-checked");
        }
      });
    });
  });
});
