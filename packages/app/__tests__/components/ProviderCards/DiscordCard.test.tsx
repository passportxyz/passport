import React from "react";
import { screen } from "@testing-library/react";
import { DiscordCard } from "../../../components/ProviderCards";

import { UserContextState } from "../../../context/userContext";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../../context/ceramicContext";

import { STAMP_PROVIDERS } from "../../../config/providers";
import { discordStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";

jest.mock("../../../utils/onboard.ts");

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("when user has not verfied with DiscordProvider", () => {
  it("should display a discord verification button", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <DiscordCard />);

    const discordVerifyButton = screen.queryByTestId("button-verify-discord");

    expect(discordVerifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with DiscordProvider", () => {
  it("should display that discord is verified", () => {
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        allProvidersState: {
          Discord: {
            providerSpec: STAMP_PROVIDERS.Discord,
            stamp: discordStampFixture,
          },
        },
      },
      <DiscordCard />
    );

    const discordVerified = screen.queryByText(/Verified/);

    expect(discordVerified).toBeInTheDocument();
  });
});
