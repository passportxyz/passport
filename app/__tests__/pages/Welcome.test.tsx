import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import Welcome from "../../components/Welcome";
import { HashRouter as Router } from "react-router-dom";
import * as framework from "@self.id/framework";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { Stamp } from "@gitcoin/passport-types";

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

jest.mock("@self.id/framework", () => {
  return {
    useViewerConnection: jest.fn(),
  };
});

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

const ceramicWithPassport = {
  ...mockCeramicContext,
  passport: { stamps: [{} as Stamp] },
} as unknown as CeramicContextState;

jest.mock("../../components/InitialWelcome.tsx", () => ({
  InitialWelcome: () => <div data-testid="initial-welcome" />,
}));

beforeEach(() => {
  jest.clearAllMocks();
  (framework.useViewerConnection as jest.Mock).mockImplementation(() => [
    {
      status: "connected",
    },
    jest.fn(),
    jest.fn(),
  ]);
});

describe("Welcome", () => {
  it("renders the page", () => {
    renderWithContext(
      ceramicWithPassport,
      <Router>
        <Welcome />
      </Router>,
      { dbAccessTokenStatus: "connected" }
    );
    expect(screen.getByTestId("initial-welcome")).toBeInTheDocument();
  });
});
