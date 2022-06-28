import React from "react";
import { screen } from "@testing-library/react";
import { GoogleCard } from "../../../components/ProviderCards";

import { UserContextState } from "../../../context/userContext";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { googleStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../../context/ceramicContext";

jest.mock("../../../utils/onboard.ts");

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("when user has not verified with GoogleProvider", () => {
  it("should display a google verification button", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <GoogleCard />);

    const verifyGoogleButton = screen.queryByTestId("button-verify-google");

    expect(verifyGoogleButton).toBeInTheDocument();
  });
});

describe("when user has verified with GoogleProvider", () => {
  it("should display that google is verified", () => {
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        allProvidersState: {
          Google: {
            providerSpec: STAMP_PROVIDERS.Google,
            stamp: googleStampFixture,
          },
        },
      },
      <GoogleCard />
    );

    const googleVerified = screen.queryByText(/Verified/);

    expect(googleVerified).toBeInTheDocument();
  });
});
