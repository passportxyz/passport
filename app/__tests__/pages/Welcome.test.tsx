import React from "react";
import { vi, describe, it, expect, Mock } from "vitest";
import { screen } from "@testing-library/react";
import Welcome from "../../pages/Welcome";
import { HashRouter as Router } from "react-router-dom";
import * as framework from "@self.id/framework";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { Stamp } from "@gitcoin/passport-types";

vi.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: vi.fn(),
  },
}));

vi.mock("@self.id/framework", () => {
  return {
    useViewerConnection: vi.fn(),
  };
});

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

const ceramicWithPassport = {
  ...mockCeramicContext,
  passport: { stamps: [{} as Stamp] },
} as unknown as CeramicContextState;

vi.mock("../../components/InitialWelcome.tsx", () => ({
  InitialWelcome: () => <div data-testid="initial-welcome" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
  (framework.useViewerConnection as Mock).mockImplementation(() => [
    {
      status: "connected",
    },
    vi.fn(),
    vi.fn(),
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
