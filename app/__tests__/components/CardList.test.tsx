import React from "react";
import { screen, render, fireEvent } from "@testing-library/react";

import { CardList, CardListProps } from "../../components/CardList";
import { makeTestCeramicContext, renderWithContext, scorerContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { Category, CategoryProps } from "../../components/Category";

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { filter: "" },
  }),
}));

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
    // This should no longer show the verrified button, but have the verified label instead & no button
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
  it("should render available points", () => {
    renderWithContext(mockCeramicContext, <CardList {...cardListProps} />);
    const availablePnts = screen.getAllByTestId("available-points").map((el) => el.textContent);

    //the verified stamp no longer shows the score of availablepoints
    expect(availablePnts).toEqual(["12.93", "7.44", "0.69"]);
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
