import React from "react";
import { render, screen } from "@testing-library/react";

import { NoStampModal, NoStampModalProps } from "../../components/NoStampModal";

let props: NoStampModalProps;

beforeEach(() => {
  props = {
    isOpen: true,
    onClose: jest.fn(),
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("NoStampModal", () => {
  describe("linking another account", () => {
    it("opens", () => {
      render(<NoStampModal {...props} />);
      expect(screen.getByText("No Stamp Found")).toBeInTheDocument();
    });
  });
});
