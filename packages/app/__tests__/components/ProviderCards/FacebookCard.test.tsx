import React from "react";
import { screen } from "@testing-library/react";
import { FacebookCard } from "../../../components/ProviderCards";

import { UserContextState } from "../../../context/userContext";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { facebookStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../../context/ceramicContext";

jest.mock("../../../utils/onboard.ts");

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("when user has not verified with FacebookProvider", () => {
  it("should display a facebook verification button", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <FacebookCard />);

    const verifyFacebookButton = screen.queryByTestId("button-verify-facebook");

    expect(verifyFacebookButton).toBeInTheDocument();
  });
});

describe("when user has verified with FacebookProvider", () => {
  it("should display that facebook is verified", () => {
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        allProvidersState: {
          Facebook: {
            providerSpec: STAMP_PROVIDERS.Facebook,
            stamp: facebookStampFixture,
          },
        },
      },
      <FacebookCard />
    );

    const facebookVerified = screen.queryByText(/Verified/);

    expect(facebookVerified).toBeInTheDocument();
  });
});
