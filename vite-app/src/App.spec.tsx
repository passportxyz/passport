import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

jest.mock("./utils/onboard.ts");

test("renders connect wallet button", () => {
  expect.assertions(1);
  render(<App />);
  const connectWalletButton = screen.getByTestId("connectWalletButton");
  expect(connectWalletButton).toBeInTheDocument();
});

test("clicking connect wallet button renders wallet selection modal", async () => {
  expect.assertions(2);

  render(<App />);
  const connectWalletButton = screen.getByTestId("connectWalletButton");

  // Click button
  userEvent.click(connectWalletButton);

  const walletSelectionModal = await screen.findByText(
    "Select your wallet from the options to get started",
    {},
    {
      timeout: 100,
    },
  );
  expect(walletSelectionModal).toBeInTheDocument();

  const metamaskButton = await screen.getByRole("button", {
    name: "MetaMask",
  });
  expect(metamaskButton).toBeInTheDocument();
});
