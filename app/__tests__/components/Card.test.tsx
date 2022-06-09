import React from "react";
import { render, screen } from "@testing-library/react";

import { VerifiableCredential } from "@gitcoin/passport-types";
import { mock } from "jest-mock-extended";

import { Card, CardProps } from "../../components/Card";

import { UserContext, UserContextState } from "../../context/userContext";
import { ProviderSpec } from "../../config/providers";

jest.mock("../../utils/onboard.ts");

// Mock isLoadingPassport in each describes beforeEach
const mockUserContext: UserContextState = {} as UserContextState;

let cardProps: CardProps;

describe("when the passport is loading", () => {
  beforeEach(() => {
    // set up in a loading state...
    mockUserContext.isLoadingPassport = true;
    // set up Some provider without a VC
    cardProps = {
      providerSpec: { name: "Some", description: "Some desc" } as ProviderSpec,
      verifiableCredential: undefined,
      issueCredentialWidget: <div data-testid="some-widget" />,
    };
  });

  it("should show loading spinner", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <Card {...cardProps} />
      </UserContext.Provider>
    );

    expect(screen.queryByTitle("loading...")).toBeInTheDocument();
    expect(screen.queryByTestId("some-widget")).not.toBeInTheDocument();
  });
});

describe("when the user is not verified", () => {
  beforeEach(() => {
    mockUserContext.passport = {
      expiryDate: new Date(),
      issuanceDate: new Date(),
      stamps: [],
    };
    mockUserContext.isLoadingPassport = false;
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

      render(<Card {...cardProps} />);

      expect(screen.getByTestId("loading-indicator")).toBeInTheDocument();
    });
  });

  describe("when the user is not verifying a stamp", () => {
    it("should not show a loading indicator", () => {
      cardProps = {
        ...cardProps,
        isLoading: false,
      };

      render(<Card {...cardProps} />);

      expect(screen.queryByTestId("loading-indicator")).not.toBeInTheDocument();
    });
  });

  it("should show verification button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <Card {...cardProps} />
      </UserContext.Provider>
    );

    expect(screen.getByTestId("some-widget")).toBeInTheDocument();
  });
});

describe("when the user is verified", () => {
  beforeEach(() => {
    mockUserContext.passport = {
      expiryDate: new Date(),
      issuanceDate: new Date(),
      stamps: [],
    };
    mockUserContext.isLoadingPassport = false;
    // set up Some provider with a mocked VC (verified)
    cardProps = {
      providerSpec: { name: "Some", description: "Some desc" } as ProviderSpec,
      verifiableCredential: mock<VerifiableCredential>(),
      issueCredentialWidget: <div data-testid="some-widget" />,
    };
  });

  it("should show verified status", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <Card {...cardProps} />
      </UserContext.Provider>
    );

    expect(screen.getByText(/[Vv]erified/)).toBeInTheDocument();
    expect(screen.queryByText("Verify Button")).not.toBeInTheDocument();
  });
});
