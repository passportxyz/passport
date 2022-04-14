import React from "react";
import { render, screen } from "@testing-library/react";
import { GoogleProvider } from "../../../src/components/providers";

import { UserContext, UserContextState } from "../../../src/App";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";

jest.mock("../../../src/utils/onboard.ts");

const mockHandleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const mockHasStamp = jest.fn(() => false);
const getStampIndex = jest.fn();
const handleSaveStamp = jest.fn();
const handleAddStamp = jest.fn();
const mockUserContext: UserContextState = {
  loggedIn: true,
  passport: undefined,
  hasStamp: mockHasStamp,
  getStampIndex: getStampIndex,
  handleSaveStamp: handleSaveStamp,
  handleAddStamp: handleAddStamp,
  handleCreatePassport: mockCreatePassport,
  handleConnection: mockHandleConnection,
  address: mockAddress,
  connectedWallets: [mockWallet],
  signer: undefined,
  walletLabel: mockWallet.label,
};

describe("when user has not verfied with GoogleProvider", () => {
  it("should display a google verification button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <GoogleProvider />
      </UserContext.Provider>
    );

    const verifyGoogleButton = screen.queryByRole("button", {
      name: /Verify with Google/,
    });

    expect(verifyGoogleButton).toBeInTheDocument();
  });
});

describe("when user has verified with GoogleProvider", () => {
  it("should display that google is verified", () => {
    render(
      <UserContext.Provider value={{ ...mockUserContext, hasStamp: (): boolean => true }}>
        <GoogleProvider />
      </UserContext.Provider>
    );

    const googleVerified = screen.queryByText(/Google: ✅ Verified/);

    expect(googleVerified).toBeInTheDocument();
  });
});
