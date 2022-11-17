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

jest.mock("../../utils/onboard.ts");

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
});
