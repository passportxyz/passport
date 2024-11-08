import { vi, describe, it, expect } from "vitest";
import React from "react";
import { screen, render } from "@testing-library/react";

import { CardList, CardListProps } from "../../components/CardList";
import {
  makeTestCeramicContext,
  makeTestCeramicContextWithExpiredStamps,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContext, CeramicContextState } from "../../context/ceramicContext";
import { Category, CategoryProps } from "../../components/Category";
import { PlatformCard } from "../../components/PlatformCard";
import { PlatformScoreSpec, ScorerContextState } from "../../context/scorerContext";
import { DEFAULT_CUSTOMIZATION, useCustomization } from "../../hooks/useCustomization";
import { platforms } from "@gitcoin/passport-platforms";

vi.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: vi.fn(),
  },
}));

vi.mock("next/router", () => ({
  useRouter: () => ({
    query: { filter: "" },
  }),
}));

vi.mock("../../hooks/useCustomization");

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

let cardListProps: CardListProps = {};
let categoryProps: CategoryProps = {
  category: {
    name: "Social & Professional Platforms",
    description: "Link your profiles from established social media and professional networking sites for verification.",
    sortedPlatforms: [
      {
        connectMessage: "Connect Account",
        description: "Connect to GitHub to verify your code contributions.",
        earnedPoints: 3,
        icon: "./assets/githubWhiteStampIcon.svg",
        name: "Github",
        platform: "Github",
        possiblePoints: 7.0600000000000005,
        website: "https://github.com",
      },
      {
        connectMessage: "Connect Account",
        description: "Connect to Google to verify your email address.",
        earnedPoints: 0,
        icon: "./assets/googleStampIcon.svg",
        name: "Google",
        platform: "Google",
        possiblePoints: 0.525,
        website: "https://www.google.com/",
      },
      {
        connectMessage: "Connect Account",
        description: "Connect your Discord account to Gitcoin Passport to identity and reputation in Web3 communities.",
        earnedPoints: 0,
        icon: "./assets/discordStampIcon.svg",
        name: "Discord",
        platform: "Discord",
        possiblePoints: 0.516,
        website: "https://discord.com/",
      },
    ],
  },
};

describe("<CardList />", () => {
  beforeEach(() => {
    cardListProps = {};
    vi.mocked(useCustomization).mockReturnValue({ ...DEFAULT_CUSTOMIZATION });
  });

  it("renders provider cards when loading state is not defined", () => {
    renderWithContext(mockCeramicContext, <CardList {...cardListProps} />);
    expect(screen.queryByTestId("loading-card")).not.toBeInTheDocument();
  });

  it("renders provider cards when not loading", () => {
    cardListProps.isLoading = false;
    renderWithContext(mockCeramicContext, <CardList {...cardListProps} />);

    expect(screen.queryByTestId("loading-card")).not.toBeInTheDocument();
  });

  it("renders LoadingCards when loading the passport", () => {
    cardListProps.isLoading = true;

    renderWithContext(mockCeramicContext, <CardList {...cardListProps} />);

    expect(screen.getAllByTestId("loading-card"));
  });

  it("renders cards by verification status and possible points", () => {
    renderWithContext(mockCeramicContext, <CardList {...cardListProps} />);
    const possiblePoints = screen.getAllByTestId("platform-name").map((el) => el.textContent);
    expect(possiblePoints).toEqual(["Gitcoin", "GTC Staking", "Discord", "Google"]);
  });

  it("should indicate on card whether or not it has been verified", () => {
    render(<Category category={categoryProps["category"]} />);
    const verifiedBtnCnt = screen
      .getAllByTestId("connect-button")
      .map((el) => el.textContent)
      .filter((text) => text === "Verified").length;

    const verifiedLabelCnt = screen
      .getAllByTestId("verified-label")
      .map((el) => el.textContent)
      .filter((text) => text === "Verified").length;

    expect(verifiedBtnCnt).toEqual(0);
    expect(verifiedLabelCnt).toBeGreaterThan(0);
    expect(verifiedLabelCnt).toEqual(
      categoryProps["category"].sortedPlatforms.filter((platform) => platform.earnedPoints > 0).length
    );
  });

  it("should indicate on card whether or not it has been expired", () => {
    const mockCeramicContextWithExpiredStamps: CeramicContextState = makeTestCeramicContextWithExpiredStamps();

    const mockSetCurrentPlatform = vi.fn();
    const mockOnOpen = vi.fn();
    render(
      <CeramicContext.Provider value={mockCeramicContextWithExpiredStamps}>
        <PlatformCard
          i={0}
          platform={{
            platform: "ETH",
            name: "ETH",
            description: "ETH",
            connectMessage: "ETH",
            possiblePoints: 10,
            earnedPoints: 7,
          }}
          onOpen={mockOnOpen}
          setCurrentPlatform={mockSetCurrentPlatform}
        />
      </CeramicContext.Provider>
    );

    const updateBtnCnt = screen
      .getAllByTestId("update-button")
      .map((el) => el.textContent)
      .filter((text) => text === "Update").length;

    const expiredLabelCnt = screen
      .getAllByTestId("expired-label")
      .map((el) => el.textContent)
      .filter((text) => text === "Expired").length;

    expect(updateBtnCnt).toBeGreaterThan(0);
    expect(expiredLabelCnt).toBeGreaterThan(0);
  });

  it("should render available points", () => {
    renderWithContext(mockCeramicContext, <CardList {...cardListProps} />);
    const availablePnts = screen.getAllByTestId("available-points").map((el) => el.textContent);

    //the verified stamp no longer shows the score of availablepoints
    expect(availablePnts).toEqual(["12.9", "7.4", "0.7"]);
  });
  it("renders allowList if stamp is present", () => {
    const scorerContext = {
      scoredPlatforms: [
        {
          icon: "./assets/star-light.svg",
          platform: "AllowList",
          name: "Guest List",
          description: "Verify you are part of a community",
          connectMessage: "Verify",
          isEVM: true,
          possiblePoints: 100,
          earnedPoints: 100,
        },
      ] as PlatformScoreSpec[],
    };
    renderWithContext(mockCeramicContext, <CardList {...cardListProps} />, {}, scorerContext);
    expect(screen.getByText("Guest List")).toBeInTheDocument();
  });
  it("should not render allow list", () => {
    renderWithContext(mockCeramicContext, <CardList {...cardListProps} />);
    expect(screen.queryByText("Guest List")).not.toBeInTheDocument();
  });
});

test("renders Category component", () => {
  render(<Category category={categoryProps["category"]} />);

  const button = screen.getByText(categoryProps["category"].name);
  expect(button).toBeInTheDocument();

  expect(screen.getByText(categoryProps["category"].description)).toBeInTheDocument();

  const cards = screen.getAllByTestId("platform-card");
  expect(cards).toHaveLength(categoryProps["category"].sortedPlatforms.length);
});

describe("show/hide tests", () => {
  it("should show allow list stamp if user has points", () => {
    vi.mocked(useCustomization).mockReturnValue({
      partnerName: "TestPartner",
      scorer: {
        weights: {
          "AllowList#test": 10,
        },
      },
      allowListProviders: [
        {
          platformGroup: "Custom Allow Lists",
          providers: [
            {
              title: "Allow List Provider",
              description: "Check to see if you are on the Guest List.",
              name: "AllowList#test",
            },
          ],
        },
      ],
    });
    const scorerContext: Partial<ScorerContextState> = {
      scoredPlatforms: [
        {
          possiblePoints: 10,
          earnedPoints: 10,
          platform: "AllowList",
          name: "Allow List Platform",
          description: "AllowList",
          connectMessage: "Connect",
        },
      ],
    };
    renderWithContext(mockCeramicContext, <CardList {...cardListProps} />, {}, scorerContext);

    // Platform card should be shown
    expect(screen.queryByText("Allow List Platform")).toBeInTheDocument();

    // Custom stamp section should be shown
    expect(screen.queryByText("TestPartner Stamps")).toBeInTheDocument();
  });

  it("should hide allow list stamp if user has no points", () => {
    vi.mocked(useCustomization).mockReturnValue({
      partnerName: "TestPartner",
      scorer: {
        weights: {
          "AllowList#test": 10,
        },
      },
      allowListProviders: [
        {
          platformGroup: "Custom Allow Lists",
          providers: [
            {
              title: "Allow List Provider",
              description: "Check to see if you are on the Guest List.",
              name: "AllowList#test",
            },
          ],
        },
      ],
    });
    const scorerContext: Partial<ScorerContextState> = {
      scoredPlatforms: [
        {
          possiblePoints: 10,
          earnedPoints: 0,
          platform: "AllowList",
          name: "Allow List Platform",
          description: "AllowList",
          connectMessage: "Connect",
        },
      ],
    };
    renderWithContext(mockCeramicContext, <CardList {...cardListProps} />, {}, scorerContext);

    // Platform card should be hidden
    expect(screen.queryByText("Allow List Platform")).not.toBeInTheDocument();

    // Custom stamp section should be hidden
    expect(screen.queryByText("TestPartner Stamps")).not.toBeInTheDocument();
  });

  it("include platform if any stamps included", () => {
    vi.mocked(useCustomization).mockReturnValue({
      scorer: {
        weights: {
          SelfStakingBronze: "1",
          SelfStakingSilver: "1",
          SelfStakingGold: "1",
          BeginnerCommunityStaker: "1",
          ExperiencedCommunityStaker: "1",
          TrustedCitizen: "1",
        },
      },
    });

    const scorerContext: Partial<ScorerContextState> = {
      scoredPlatforms: [
        {
          possiblePoints: 10,
          earnedPoints: 2,
          ...platforms["GtcStaking"].PlatformDetails,
        },
      ],
    };

    renderWithContext(mockCeramicContext, <CardList {...cardListProps} />, {}, scorerContext);

    // Platform card should be shown
    expect(screen.queryByText("GTC Staking")).toBeInTheDocument();

    // Category should be shown
    expect(screen.queryByText("Blockchain & Crypto Networks")).toBeInTheDocument();
  });

  it("exclude platform if no stamps included", () => {
    vi.mocked(useCustomization).mockReturnValue({
      scorer: {
        weights: {
          ADifferentStamp: "1",
        },
      },
    });

    const scorerContext: Partial<ScorerContextState> = {
      scoredPlatforms: [
        {
          possiblePoints: 10,
          earnedPoints: 2,
          ...platforms["GtcStaking"].PlatformDetails,
        },
      ],
    };

    renderWithContext(mockCeramicContext, <CardList {...cardListProps} />, {}, scorerContext);

    // Platform card should be hidden
    expect(screen.queryByText("GTC Staking")).not.toBeInTheDocument();

    // Category should be hidden
    expect(screen.queryByText("Blockchain & Crypto Networks")).not.toBeInTheDocument();
  });

  it("include platform if customization doesn't specify custom weights", () => {
    vi.mocked(useCustomization).mockReturnValue({} as any);

    const scorerContext: Partial<ScorerContextState> = {
      scoredPlatforms: [
        {
          possiblePoints: 10,
          earnedPoints: 2,
          ...platforms["GtcStaking"].PlatformDetails,
        },
      ],
    };

    renderWithContext(mockCeramicContext, <CardList {...cardListProps} />, {}, scorerContext);

    // Platform card should be shown
    expect(screen.queryByText("GTC Staking")).toBeInTheDocument();

    // Category should be shown
    expect(screen.queryByText("Blockchain & Crypto Networks")).toBeInTheDocument();
  });

  it("hide platform if there are no possible points", () => {
    vi.mocked(useCustomization).mockReturnValue({} as any);

    const scorerContext: Partial<ScorerContextState> = {
      scoredPlatforms: [
        {
          possiblePoints: 0,
          earnedPoints: 0,
          ...platforms["GtcStaking"].PlatformDetails,
        },
      ],
    };

    renderWithContext(mockCeramicContext, <CardList {...cardListProps} />, {}, scorerContext);

    // Platform card should be hidden
    expect(screen.queryByText("GTC Staking")).not.toBeInTheDocument();

    // Category should be hidden
    expect(screen.queryByText("Blockchain & Crypto Networks")).not.toBeInTheDocument();
  });
});
