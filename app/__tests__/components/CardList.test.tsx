import React from "react";
import { screen } from "@testing-library/react";

import { UserContextState } from "../../context/userContext";
import { CardList, CardListProps } from "../../components/CardList";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { ScorerContextState } from "../../context/scorerContext";

jest.mock("../../utils/onboard.ts");

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

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

let cardListProps: CardListProps = {};

const scorerContext = {
  scoredPlatforms: [
    {
      icon: "./assets/gtcStakingLogoIcon.svg",
      platform: "GtcStaking",
      name: "GTC Staking",
      description: "Connect to passport to verify your staking amount.",
      connectMessage: "Verify amount",
      isEVM: true,
      possiblePoints: 7.4399999999999995,
      earnedPoints: 0,
    },
    {
      icon: "./assets/gtcGrantsLightIcon.svg",
      platform: "Gitcoin",
      name: "Gitcoin",
      description: "Connect with Github to verify with your Gitcoin account.",
      connectMessage: "Connect Account",
      isEVM: true,
      possiblePoints: 12.93,
      earnedPoints: 0,
    },
    {
      icon: "./assets/twitterStampIcon.svg",
      platform: "Twitter",
      name: "Twitter",
      description: "Connect your existing Twitter account to verify.",
      connectMessage: "Connect Account",
      possiblePoints: 3.63,
      earnedPoints: 3.63,
    },
    {
      icon: "./assets/discordStampIcon.svg",
      platform: "Discord",
      name: "Discord",
      description: "Connect your existing Discord account to verify.",
      connectMessage: "Connect Account",
      possiblePoints: 0.689,
      earnedPoints: 0,
    },
    {
      icon: "./assets/googleStampIcon.svg",
      platform: "Google",
      name: "Google",
      description: "Connect your existing Google Account to verify",
      connectMessage: "Connect Account",
      possiblePoints: 2.25,
      earnedPoints: 1,
    },
  ],
} as ScorerContextState;

describe("<CardList />", () => {
  beforeEach(() => {
    cardListProps = {};
  });

  it("renders provider cards when loading state is not defined", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <CardList {...cardListProps} />, scorerContext);
    expect(screen.queryByTestId("loading-card")).not.toBeInTheDocument();
  });

  it("renders provider cards when not loading", () => {
    cardListProps.isLoading = false;
    renderWithContext(mockUserContext, mockCeramicContext, <CardList {...cardListProps} />, scorerContext);

    expect(screen.queryByTestId("loading-card")).not.toBeInTheDocument();
  });

  it("renders LoadingCards when loading the passport", () => {
    cardListProps.isLoading = true;

    renderWithContext(mockUserContext, mockCeramicContext, <CardList {...cardListProps} />, scorerContext);

    expect(screen.getAllByTestId("loading-card"));
  });

  it("renders cards by verification status and possible points", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <CardList {...cardListProps} />, scorerContext);
    const possiblePoints = screen.getAllByTestId("platform-name").map((el) => el.textContent);
    expect(possiblePoints).toEqual(["Gitcoin", "GTC Staking", "Discord", "Google", "Twitter"]);
  });
  it("should indicate on card whether or not it has been verified", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <CardList {...cardListProps} />, scorerContext);
    const verifiedBtnCnt = screen
      .getAllByTestId("connect-button")
      .map((el) => el.textContent)
      .filter((text) => text === "Verified").length;
    expect(verifiedBtnCnt).toBeGreaterThan(0);
    expect(verifiedBtnCnt).toEqual(
      scorerContext.scoredPlatforms.filter((platform) => platform.earnedPoints > 0).length
    );
  });
  it("should render available points", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <CardList {...cardListProps} />, scorerContext);
    const availablePnts = screen.getAllByTestId("available-points").map((el) => el.textContent);
    expect(availablePnts).toEqual(["12.93", "7.44", "0.69", "1.25", "0.00"]);
  });
});
