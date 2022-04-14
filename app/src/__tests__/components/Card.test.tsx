import React from "react";
import { render, screen, waitFor } from "@testing-library/react";

import { Card } from "../../components/Card";

it("should show verification button when user is not verified", () => {
  render(
    <Card
      vcdata={{
        icon: "string",
        verificationButton: <button>Verify Button</button>,
        name: "string",
        description: "string",
        output: <div></div>,
        isVerified: false,
      }}
    ></Card>
  );

  expect(screen.getByText("Verify Button")).toBeInTheDocument();
});

it("should show verified status when user is verified", () => {
  render(
    <Card
      vcdata={{
        icon: "string",
        verificationButton: <button>Verify Button</button>,
        name: "string",
        description: "string",
        output: <div></div>,
        isVerified: true,
      }}
    ></Card>
  );

  expect(screen.getByText(/[Vv]erified/)).toBeInTheDocument();
  expect(screen.queryByText("Verify Button")).not.toBeInTheDocument();
});
