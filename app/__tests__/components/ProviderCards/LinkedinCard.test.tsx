import React from "react";
import { screen } from "@testing-library/react";
import { LinkedinCard } from "../../../components/ProviderCards";

import { UserContextState } from "../../../context/userContext";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { linkedinStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../../context/ceramicContext";

jest.mock("../../../utils/onboard.ts");

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("when user has not verified with LinkedinProvider", () => {
  it("should display a linkedin verification button", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <LinkedinCard />);

    const verifyLinkedinButton = screen.queryByTestId("button-verify-linkedin");

    expect(verifyLinkedinButton).toBeInTheDocument();
  });
});

describe("when user has verified with LinkedinProvider", () => {
  it("should display that linkedin is verified", () => {
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        allProvidersState: {
          Linkedin: {
            providerSpec: STAMP_PROVIDERS.Linkedin,
            stamp: linkedinStampFixture,
          },
        },
      },
      <LinkedinCard />
    );

    const linkedinVerified = screen.queryByText(/Verified/);

    expect(linkedinVerified).toBeInTheDocument();
  });
});
