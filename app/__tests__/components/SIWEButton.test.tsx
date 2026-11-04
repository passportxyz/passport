import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import SIWEButton from "../../components/SIWEButton";

describe("SIWEButton", () => {
  it("shows the spinner while loading", () => {
    const { container } = render(<SIWEButton enableEthBranding isLoading loadIconPosition="right" />);

    expect(screen.queryByTestId("spinner")).not.toBeNull();
    expect(container.querySelector("button")?.disabled).toBe(true);
  });

  it("shows no spinner when idle", () => {
    render(<SIWEButton enableEthBranding isLoading={false} loadIconPosition="right" />);

    expect(screen.queryByTestId("spinner")).toBeNull();
  });

  // Home puts it before the label, like the header's "Connecting...".
  it("puts the spinner before the label with loadIconPosition left", () => {
    const { container } = render(<SIWEButton enableEthBranding isLoading loadIconPosition="left" />);

    expect(container.querySelector("button")?.firstElementChild).toBe(screen.getByTestId("spinner"));
  });

  // The same ring as the header's "Connecting...", in the button's text colour so it shows on the
  // black primary button.
  it("draws the header's ring in the button's text colour", () => {
    render(<SIWEButton enableEthBranding isLoading loadIconPosition="right" />);

    const classes = screen.getByTestId("spinner").className;
    expect(classes).toContain("animate-spin");
    expect(classes).toContain("border-current");
    expect(classes).toContain("border-t-transparent");
  });
});
