import { vi, describe, it, expect } from "vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { CredentialCard } from "../../../components/StampDrawer/components/CredentialCard";

describe("CredentialCard", () => {
  const defaultProps = {
    name: "Test Credential",
    description: "Test description",
    verified: false,
    points: 1.5,
  };

  it("should render credential name and description", () => {
    render(<CredentialCard {...defaultProps} />);
    expect(screen.getByText("Test Credential")).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("should display points correctly", () => {
    render(<CredentialCard {...defaultProps} />);
    expect(screen.getByText("1.5")).toBeInTheDocument();
  });

  it("should display points without decimal for whole numbers", () => {
    render(<CredentialCard {...defaultProps} points={2.0} />);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("should show + prefix for verified credentials without flags", () => {
    render(<CredentialCard {...defaultProps} verified={true} />);
    expect(screen.getByText("+1.5")).toBeInTheDocument();
  });

  it("should have green background when verified without flags", () => {
    const { container } = render(<CredentialCard {...defaultProps} verified={true} />);
    const card = container.firstChild;
    expect(card).toHaveClass("bg-[#befee2]");
  });

  it("should show expired flag", () => {
    render(<CredentialCard {...defaultProps} flags={["expired"]} />);
    expect(screen.getByText("Expired")).toBeInTheDocument();
  });

  it("should show deduplicated flag with info link", () => {
    render(<CredentialCard {...defaultProps} flags={["deduplicated"]} />);
    expect(screen.getByText("Deduplicated")).toBeInTheDocument();

    const infoLink = screen.getByRole("link");
    expect(infoLink).toHaveAttribute("href", expect.stringContaining("support.passport.xyz"));
  });

  it("should show both flags when provided", () => {
    render(<CredentialCard {...defaultProps} flags={["expired", "deduplicated"]} />);
    expect(screen.getByText("Expired")).toBeInTheDocument();
    expect(screen.getByText("Deduplicated")).toBeInTheDocument();
  });

  it("should have gray background when flags are present", () => {
    const { container } = render(<CredentialCard {...defaultProps} verified={true} flags={["expired"]} />);
    const card = container.firstChild;
    expect(card).toHaveClass("bg-color-3");
  });

  it("should not show + prefix when flags are present", () => {
    render(<CredentialCard {...defaultProps} verified={true} flags={["expired"]} />);
    expect(screen.getByText("1.5")).toBeInTheDocument();
    expect(screen.queryByText("+1.5")).not.toBeInTheDocument();
  });
});
