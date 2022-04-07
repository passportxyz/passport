// if user has no passport show create passport button

// if user has passport display stamps
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Passport } from "../views";
import { UserContext, UserContextState } from "../App";
import { Account, WalletState } from "@web3-onboard/core/dist/types";

jest.mock("../utils/onboard.ts");

const mockAddress = "0xmyAddress";
const mockAccount: Account = {
  address: mockAddress,
  ens: null,
  balance: null,
};
const mockWallet: WalletState = {
  label: "myWallet",
  icon: "",
  provider: { on: jest.fn(), removeListener: jest.fn(), request: jest.fn() },
  accounts: [mockAccount],
  chains: [],
};
const mockHandleConnection = jest.fn();
const mockUserContext: UserContextState = {
  loggedIn: true,
  handleConnection: mockHandleConnection,
  address: mockAddress,
  connectedWallets: [mockWallet],
  signer: undefined,
  walletLabel: mockWallet.label,
};

describe("when user has a connected wallet", () => {
  it("should display wallet address", async () => {
    expect.assertions(1);

    render(
      <UserContext.Provider value={mockUserContext}>
        <Passport />
      </UserContext.Provider>
    );

    const expectedAddress = await screen.findByText(/0xmyAddress/);
    expect(expectedAddress).toBeInTheDocument();
  });

  it("should have a disconnect button", async () => {
    expect.assertions(2);

    render(
      <UserContext.Provider value={mockUserContext}>
        <Passport />
      </UserContext.Provider>
    );

    const disconnectWalletButton = screen.getByRole("button", {
      name: /Disconnect/,
    });

    expect(disconnectWalletButton).toBeInTheDocument();

    userEvent.click(disconnectWalletButton);

    await waitFor(() => {
      expect(mockHandleConnection).toBeCalledTimes(1);
    });
  });
});
