import React from "react";
import { screen } from "@testing-library/react";

import { VerifiableCredential } from "@gitcoin/passport-types";
import { mock } from "jest-mock-extended";

import { Card, CardProps } from "../../components/Card";

import { UserContextState } from "../../context/userContext";
import { ProviderSpec } from "../../config/providers";
import { CeramicContextState, IsLoadingPassportState } from "../../context/ceramicContext";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";

jest.mock("../../utils/onboard.ts");

let mockUserContext: UserContextState = {} as UserContextState;
let mockCeramicContext: CeramicContextState = makeTestCeramicContext({
  passport: {
    issuanceDate: new Date(),
    expiryDate: new Date(),
    stamps: [],
    streamIDs: [],
  },
});
let cardProps: CardProps;

beforeEach(() => {
  mockCeramicContext = makeTestCeramicContext({
    passport: {
      issuanceDate: new Date(),
      expiryDate: new Date(),
      stamps: [],
      streamIDs: [],
    },
  });
});

describe("when the passport is loading", () => {
  beforeEach(() => {
    // set up in a loading state...
    mockCeramicContext.isLoadingPassport = IsLoadingPassportState.Loading;
    // set up Some provider without a VC
    cardProps = {
      providerSpec: { name: "Some", description: "Some desc" } as ProviderSpec,
      verifiableCredential: undefined,
      issueCredentialWidget: <div data-testid="some-widget" />,
    };
  });

  it("should show loading spinner", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <Card {...cardProps} />);

    expect(screen.getByTitle("loading..."));
    expect(screen.queryByTestId("some-widget")).not.toBeInTheDocument();
  });
});

describe("when the user is not verified", () => {
  beforeEach(() => {
    // set up Some provider without a VC
    cardProps = {
      providerSpec: { name: "Some", description: "Some desc" } as ProviderSpec,
      verifiableCredential: undefined,
      issueCredentialWidget: <div data-testid="some-widget" />,
    };
  });

  describe("when the user is verifying a stamp", () => {
    it("should show a loading indicator", () => {
      cardProps = {
        ...cardProps,
        isLoading: true,
      };

      renderWithContext(mockUserContext, mockCeramicContext, <Card {...cardProps} />);

      expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    });
  });

  describe("when the user is not verifying a stamp", () => {
    it("should not show a loading indicator", () => {
      cardProps = {
        ...cardProps,
        isLoading: false,
      };

      renderWithContext(mockUserContext, mockCeramicContext, <Card {...cardProps} />);

      expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
    });
  });

  it("should show verification button", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <Card {...cardProps} />);

    expect(screen.getByTestId("some-widget")).toBeInTheDocument();
  });
});

describe("when the user is verified", () => {
  beforeEach(() => {
    // set up Some provider with a mocked VC (verified)
    cardProps = {
      providerSpec: { name: "Some", description: "Some desc" } as ProviderSpec,
      verifiableCredential: mock<VerifiableCredential>(),
      issueCredentialWidget: <div data-testid="some-widget" />,
    };
  });

  it("should show verified status", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <Card {...cardProps} />);

    expect(screen.getByText(/[Vv]erified/)).toBeInTheDocument();
    expect(screen.queryByText("Verify Button")).not.toBeInTheDocument();
  });
});
