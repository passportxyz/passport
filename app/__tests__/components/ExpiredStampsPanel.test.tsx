import React from "react";
import { screen } from "@testing-library/react";

import { UserContextState } from "../../context/userContext";
import { CardList, CardListProps } from "../../components/CardList";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
  makeTestCeramicContextWithExpiredStamps,
} from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { ExpiredStampsPanel } from "../../components/ExpiredStampsPanel";

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

describe("<ExpiredStampsPanel />", () => {
  it("renders the text informing use he does not have any expired stamps", () => {
    console.log("mockCeramicContext", mockCeramicContext);
    renderWithContext(mockUserContext, mockCeramicContext, <ExpiredStampsPanel className="col-span-full" />);
    expect(screen.queryByText("Expired Stamps")).toBeInTheDocument();
    expect(screen.queryByText("Reverify stamps")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Platform Icon")).not.toBeInTheDocument();
    expect(screen.queryByText("You don't have any expired stamps")).toBeInTheDocument();
  });

  it("renders the button to re-verify expired stamps, when there are expired stamps", () => {
    console.log("mockCeramicContext", mockCeramicContext);
    renderWithContext(
      mockUserContext,
      makeTestCeramicContextWithExpiredStamps(),
      <ExpiredStampsPanel className="col-span-full" />
    );
    expect(screen.queryByText("Expired Stamps")).toBeInTheDocument();
    expect(screen.queryByText("Reverify stamps")).toBeInTheDocument();
    expect(screen.queryByAltText("Platform Icon")).toBeInTheDocument();
    expect(screen.queryByText("You don't have any expired stamps")).not.toBeInTheDocument();
  });
});
