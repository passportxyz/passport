import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { FractalIdPlatform } from "../../../components/PlatformCards";

import { UserContextState } from "../../../context/userContext";
import { fractalIdStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
  getProviderSpec,
} from "../../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../../context/ceramicContext";

jest.mock("../../../utils/onboard.ts");

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("when user has not verified with Fractal ID", () => {
  it("should display a Fractal ID verification button", () => {
    // TODO
  });
});
