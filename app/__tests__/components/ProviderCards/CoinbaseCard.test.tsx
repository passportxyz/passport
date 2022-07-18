import React from "react";
import { screen } from "@testing-library/react";
import { CoinbaseCard } from "../../../components/ProviderCards";

import { UserContextState } from "../../../context/userContext";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { coinbaseStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../../context/ceramicContext";

jest.mock("../../../utils/onboard.ts");

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("when user has not verified with CoinbaseProvider", () => {
  it("should display a coinbase verification button", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <CoinbaseCard />);

    const coinbaseVerifyButton = screen.queryByTestId("button-verify-coinbase");

    expect(coinbaseVerifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with CoinbaseProvider", () => {
  it("should display that coinbase is verified", () => {
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        allProvidersState: {
          Coinbase: {
            providerSpec: STAMP_PROVIDERS.Coinbase,
            stamp: coinbaseStampFixture,
          },
        },
      },
      <CoinbaseCard />
    );

    const coinbaseVerified = screen.queryByText(/Verified/);

    expect(coinbaseVerified).toBeInTheDocument();
  });
});
