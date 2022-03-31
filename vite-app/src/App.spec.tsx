import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { useConnectWallet } from "@web3-onboard/react";

jest.mock("./utils/onboard.ts");

test("renders connect wallet button", () => {
  expect.assertions(1);
  render(<App />);
  const connectWalletButton = screen.getByRole("button", {
    name: "Connect",
  });
  expect(connectWalletButton).toBeInTheDocument();
});

test("clicking connect wallet button calls useConnectWallet:connect function", async () => {
  expect.assertions(1);

  render(<App />);
  const connectWalletButton = screen.getByRole("button", {
    name: "Connect",
  });

  userEvent.click(connectWalletButton);

  await waitFor(() => {
    const [, connect] = useConnectWallet();
    expect(connect).toBeCalledTimes(1);
  });
});

// TODO tests
// when localstorage state has previously connected wallet, restore wallet from localstorage
// simulate @web3-onboard/react state updates when connecting the wallet -> setting address, accounts, etc
