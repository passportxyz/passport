import { vi, describe, it, expect } from "vitest";
import React from "react";
import { screen } from "@testing-library/react";

import { SideBarContent, SideBarContentProps } from "../../components/SideBarContent";

import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";

import { CeramicContextState } from "../../context/ceramicContext";
import { Drawer, DrawerOverlay } from "@chakra-ui/react";
import { PROVIDER_ID } from "@gitcoin/passport-types";

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: { filter: "" },
  }),
}));

const verifiedProviders: PROVIDER_ID[] = ["Github", "FiveOrMoreGithubRepos", "ForkedGithubRepoProvider"];
const selectedProviders: PROVIDER_ID[] = ["Github", "FiveOrMoreGithubRepos", "ForkedGithubRepoProvider"];

const props: SideBarContentProps = {
  currentPlatform: {
    icon: "./assets/githubStampIcon.svg",
    platform: "Github",
    name: "Github",
    description: "Connect your existing Github account to verify.",
    connectMessage: "Connect Account",
    website: "https://github.com",
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

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("SideBarContent", () => {
  it("renders", () => {
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <SideBarContent {...props} />
      </Drawer>
    );
    renderWithContext(mockCeramicContext, drawer());
    expect(screen.getByText("Github")).toBeInTheDocument();
  });

  // TODO #3502: unskip once it is clear how to display and then check the verified state
  it.skip("should mark verified providers with green text", () => {
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <SideBarContent {...props} />
      </Drawer>
    );
    renderWithContext(mockCeramicContext, drawer());

    verifiedProviders.forEach((provider) => {
      expect(screen.getByTestId(`indicator-${provider}`)).toHaveClass("border-foreground-2");
    });
  });

  it("should mark non verified providers with dull border", () => {
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <SideBarContent {...props} />
      </Drawer>
    );
    renderWithContext(mockCeramicContext, drawer());

    const allProviders = props.currentProviders
      ?.map((provider) => provider.providers)
      .flat()
      .map((provider) => provider.name);

    const nonVerifiedProviders = allProviders?.filter(
      (provider) => !verifiedProviders.includes(provider as PROVIDER_ID)
    );

    nonVerifiedProviders?.forEach((provider) => {
      expect(screen.getByTestId(`indicator-${provider}`)).toHaveClass("border-color-3");
    });
  });
});
