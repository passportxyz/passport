import React from "react";
import { vi, describe, it, expect, Mock } from "vitest";
import { screen } from "@testing-library/react";
import Welcome from "../../pages/Welcome";
import { HashRouter as Router } from "react-router-dom";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../context/ceramicContext";
import { Stamp } from "@gitcoin/passport-types";

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

const ceramicWithPassport = {
  ...mockCeramicContext,
  passport: { stamps: [{} as Stamp] },
} as unknown as CeramicContextState;

vi.mock("../../components/InitialScreenLayout.tsx", () => ({
  InitialScreenWelcome: () => <div data-testid="initial-welcome" />,
}));

beforeEach(() => {
  vi.clearAllMocks();
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
