import React from "react";
import { screen } from "@testing-library/react";
import { GithubCard } from "../../../components/ProviderCards";

import { UserContextState } from "../../../context/userContext";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { githubStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../../context/ceramicContext";

jest.mock("../../../utils/onboard.ts");

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("when user has not verified with GithubProvider", () => {
  it("should display a github verification button", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <GithubCard />);

    const githubVerifyButton = screen.queryByTestId("button-verify-github");

    expect(githubVerifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with GithubProvider", () => {
  it("should display that github is verified", () => {
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        allProvidersState: {
          Github: {
            providerSpec: STAMP_PROVIDERS.Github,
            stamp: githubStampFixture,
          },
        },
      },
      <GithubCard />
    );

    const githubVerified = screen.queryByText(/Verified/);

    expect(githubVerified).toBeInTheDocument();
  });
});
