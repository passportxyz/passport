import React from "react";
import { render, screen } from "@testing-library/react";

import { VerifyModal, VerifyModalProps } from "../../components/VerifyModal";
import { ensStampFixture } from "../../__test-fixtures__/databaseStorageFixtures";

let props: VerifyModalProps;

beforeEach(() => {
  props = {
    isOpen: true,
    onClose: jest.fn(),
    handleUserVerify: jest.fn(),
    stamp: ensStampFixture,
    isLoading: false,
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe("when stamp is not defined", () => {
  beforeEach(() => {
    props.stamp = undefined;
  });

  it("should not display your stamp credential", () => {
    render(<VerifyModal {...props} />);
    expect(screen.queryByText("Your Stamp Credential")).not.toBeInTheDocument();
  });

  it("does not show the buttons", () => {
    render(<VerifyModal {...props} />);

    expect(screen.queryByTestId("modal-verify")).not.toBeInTheDocument();
    expect(screen.queryByTestId("modal-cancel")).not.toBeInTheDocument();
  });
});

describe("when stamp is defined", () => {
  it("displays the stamp credential", () => {
    render(<VerifyModal {...props} />);

    screen.getByText("Your Stamp Credential");
  });

  it("shows the buttons", () => {
    render(<VerifyModal {...props} />);

    screen.getByTestId("modal-verify");
    screen.getByTestId("modal-cancel");
  });
});

describe("when modal is loading", () => {
  beforeEach(() => {
    props.isLoading = true;
  });

  it("shows a loading spinner", () => {
    render(<VerifyModal {...props} />);

    screen.getByTestId("loading-spinner");
  });
});

describe("buttons", () => {
  it("includes a verify button that calls handleUserVerify", () => {
    render(<VerifyModal {...props} />);

    screen.getByTestId("modal-verify").click();
    expect(props.handleUserVerify).toHaveBeenCalled();
  });

  it("includes a cancel button that calls onClose", () => {
    render(<VerifyModal {...props} />);

    screen.getByTestId("modal-cancel").click();
    expect(props.onClose).toHaveBeenCalled();
  });
});
