import React from "react";
import { screen } from "@testing-library/react";

import { UserContextState } from "../../context/userContext";
import { CardList, CardListProps } from "../../components/CardList";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
  scorerContext,
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

describe("<CardList />", () => {
  beforeEach(() => {
    cardListProps = {};
  });

  it("renders provider cards when loading state is not defined", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <CardList {...cardListProps} />);
    expect(screen.queryByTestId("loading-card")).not.toBeInTheDocument();
  });

  it("renders provider cards when not loading", () => {
    cardListProps.isLoading = false;
    renderWithContext(mockUserContext, mockCeramicContext, <CardList {...cardListProps} />);

    expect(screen.queryByTestId("loading-card")).not.toBeInTheDocument();
  });

  it("renders LoadingCards when loading the passport", () => {
    cardListProps.isLoading = true;

    renderWithContext(mockUserContext, mockCeramicContext, <CardList {...cardListProps} />);

    expect(screen.getAllByTestId("loading-card"));
  });

  it("renders cards by verification status and possible points", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <CardList {...cardListProps} />);
    const possiblePoints = screen.getAllByTestId("platform-name").map((el) => el.textContent);
    expect(possiblePoints).toEqual(["Gitcoin", "GTC Staking", "Discord", "Google", "Twitter"]);
  });
  it("should indicate on card whether or not it has been verified", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <CardList {...cardListProps} />);
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
    renderWithContext(mockUserContext, mockCeramicContext, <CardList {...cardListProps} />);
    const availablePnts = screen.getAllByTestId("available-points").map((el) => el.textContent);
    expect(availablePnts).toEqual(["12.93", "7.44", "0.69", "1.25", "0.00"]);
  });
});
