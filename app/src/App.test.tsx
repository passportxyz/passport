import React from "react";
import { render, screen } from "@testing-library/react";
import App from "./App";

test("renders connect wallet button", () => {
  render(<App />);
  const connectWalletButton = screen.getByTestId("connectWalletButton");
  expect(connectWalletButton).toBeInTheDocument();
});
