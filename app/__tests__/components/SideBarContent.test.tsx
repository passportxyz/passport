import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

import { SideBarContent, SideBarContentProps } from "../../components/SideBarContent";

import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";

import { UserContextState } from "../../context/userContext";
import { CeramicContextState } from "../../context/ceramicContext";

jest.mock("../../utils/onboard.ts");

const props: SideBarContentProps = {
  currentPlatform: undefined,
  currentProviders: undefined,
  verifiedProviders: undefined,
  selectedProviders: undefined,
  setSelectedProviders: undefined,
  isLoading: undefined,
  verifyButton: undefined,
};

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("SideBarContent", () => {
  it("renders", () => {
    render(<div></div>);
  });
});
