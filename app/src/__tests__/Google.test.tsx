import React from "react";
import { render, screen } from "@testing-library/react";
import { Google } from "../views/providers/Google";

import { UserContext, UserContextState } from "../App";
import { mockAddress, mockWallet } from "../test-fixtures/onboardHookValues";

jest.mock("../utils/onboard.ts");

const mockHandleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const mockHasStamp = jest.fn(() => false);
const getStampIndex = jest.fn();
const handleSaveStamp = jest.fn();
const mockUserContext: UserContextState = {
  loggedIn: true,
  passport: undefined,
  hasStamp: mockHasStamp,
  getStampIndex: getStampIndex,
  handleSaveStamp: handleSaveStamp,
  handleCreatePassport: mockCreatePassport,
  handleConnection: mockHandleConnection,
  address: mockAddress,
  connectedWallets: [mockWallet],
  signer: undefined,
  walletLabel: mockWallet.label,
};

describe("when user has not verfied with Google", () => {
  it("should display a google verification button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <Google />
      </UserContext.Provider>
    );

    const verifyGoogleButton = screen.queryByRole("button", {
      name: /Verify with Google/,
    });

    expect(verifyGoogleButton).toBeInTheDocument();
  });
});

describe("when user has verfied with Google", () => {
  it("should display that google is verified", () => {
    render(
      <UserContext.Provider value={{ ...mockUserContext, hasStamp: (): boolean => true }}>
        <Google />
      </UserContext.Provider>
    );

    const googleVerified = screen.queryByText(/Google: ✅ Verified/);

    expect(googleVerified).toBeInTheDocument();
  });
});
