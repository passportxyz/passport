import React from "react";
import { vi, describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";

import {
  makeTestCeramicContext,
  renderWithContext,
  makeTestCeramicContextWithExpiredStamps,
} from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { ExpiredStampsPanel } from "../../components/ExpiredStampsPanel";

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

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("<ExpiredStampsPanel />", () => {
  it("renders the text informing use he does not have any expired stamps", () => {
    renderWithContext(mockCeramicContext, <ExpiredStampsPanel className="col-span-full" />);
    expect(screen.queryByText("Expired Stamps")).toBeInTheDocument();
    expect(screen.queryByText("Reverify stamps")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Platform Icon")).not.toBeInTheDocument();
    expect(screen.queryByText("You don't have any expired Stamps")).toBeInTheDocument();
  });

  it("renders the button to re-verify expired stamps, when there are expired stamps", () => {
    renderWithContext(makeTestCeramicContextWithExpiredStamps(), <ExpiredStampsPanel className="col-span-full" />);
    expect(screen.queryByText("Expired Stamps")).toBeInTheDocument();
    expect(screen.queryByText("Reverify stamps")).toBeInTheDocument();
    expect(screen.queryByAltText("Platform Icon")).toBeInTheDocument();
    expect(screen.queryByText("You don't have any expired Stamps")).not.toBeInTheDocument();
  });
});
