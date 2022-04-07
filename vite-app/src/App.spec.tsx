import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { Account, WalletState } from "@web3-onboard/core/dist/types";
import * as onboardReact from "@web3-onboard/react";

jest.mock("./utils/onboard.ts");

test("renders connect wallet button", () => {
  expect.assertions(1);
  render(<App />);
  const connectWalletButton = screen.getByRole("button", {
    name: "Get Started",
  });
  expect(connectWalletButton).toBeInTheDocument();
});

test("clicking connect wallet button calls useConnectWallet:connect function", async () => {
  expect.assertions(1);

  render(<App />);
  const connectWalletButton = screen.getByRole("button", {
    name: "Get Started",
  });

  userEvent.click(connectWalletButton);

  await waitFor(() => {
    const [, connect] = onboardReact.useConnectWallet();
    expect(connect).toBeCalledTimes(1);
  });
});

describe("when onboard has a connected wallet", () => {
  const mockAccount: Account = {
    address: "0xmyAddress",
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

  const mockDisconnectFn = jest.fn(() => new Promise<void>((resolve) => resolve()));

  beforeEach(() => {
    jest
      .spyOn(onboardReact, "useConnectWallet")
      .mockReturnValue([{ wallet: mockWallet, connecting: false }, jest.fn(), mockDisconnectFn]);

    jest.spyOn(onboardReact, "useWallets").mockReturnValue([mockWallet]);
  });

  it("should display wallet address", async () => {
    expect.assertions(1);

    render(<App />);

    const expectedAddress = await screen.findByText(/0xmyAddress/);
    expect(expectedAddress).toBeInTheDocument();
  });

  it("should have a disconnect button", async () => {
    expect.assertions(2);

    render(<App />);

    const disconnectWalletButton = screen.getByRole("button", {
      name: /Disconnect/,
    });

    expect(disconnectWalletButton).toBeInTheDocument();

    userEvent.click(disconnectWalletButton);

    await waitFor(() => {
      expect(mockDisconnectFn).toBeCalledTimes(1);
    });
  });
});
