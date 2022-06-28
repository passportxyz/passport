import React from "react";
import { screen } from "@testing-library/react";
import { TwitterCard } from "../../../components/ProviderCards";

import { UserContextState } from "../../../context/userContext";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { twitterStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../../context/ceramicContext";

jest.mock("../../../utils/onboard.ts");

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("when user has not verfied with TwitterProvider", () => {
  it("should display a twitter verification button", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <TwitterCard />);

    const twitterVerifyButton = screen.queryByTestId("button-verify-twitter");

    expect(twitterVerifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with TwitterProvider", () => {
  it("should display that twitter is verified", () => {
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        allProvidersState: {
          Twitter: {
            providerSpec: STAMP_PROVIDERS.Twitter,
            stamp: twitterStampFixture,
          },
        },
      },
      <TwitterCard />
    );

    const twitterVerified = screen.queryByText(/Verified/);

    expect(twitterVerified).toBeInTheDocument();
  });
});
