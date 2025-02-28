import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, beforeEach, afterEach, describe, it, expect } from "vitest";

import { JsonOutputModal, JsonOutputModalProps } from "../../components/JsonOutputModal";

let props: JsonOutputModalProps;
const passport = {
  issuanceDate: "2022-06-14T08:51:28.157Z",
  expiryDate: "2022-06-14T08:51:28.157Z",
  stamps: [],
};

beforeEach(() => {
  props = {
    isOpen: true,
    onClose: vi.fn(),
    subheading: "Custom subheading",
    title: "Modal Title",
    jsonOutput: passport,
    closeButtonText: "Custom Close",
  };
});

afterEach(() => {
  vi.clearAllMocks();
});

describe("displays the modal", () => {
  it("should display your modals content", () => {
    render(<JsonOutputModal {...props} />);
    const subheading = screen.queryByText("Custom subheading");
    const title = screen.queryByText("Modal Title");
    const close = screen.queryByText("Custom Close");
    const download = screen.queryByText("Download");
    const passportJsonContent = screen.getByTestId("passport-json");
    expect(passportJsonContent.textContent).toBe(JSON.stringify(passport, null, "\t"));
    expect(subheading).toBeInTheDocument();
    expect(title).toBeInTheDocument();
    expect(close).toBeInTheDocument();
    expect(download).toBeInTheDocument();
  });
});
