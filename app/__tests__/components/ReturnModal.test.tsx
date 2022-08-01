import React from "react";
import { screen } from "@testing-library/react";

import { ReturnModal, ReturnModalProps } from "../../components/ReturnModal";
import { UserContextState, UserArrivalSourceState } from "../../context/userContext";
import { CeramicContextState } from "../../context/ceramicContext";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";
import { mockAddress } from "../../__test-fixtures__/onboardHookValues";
import { JsonRpcSigner } from "@ethersproject/providers";
import { mock } from "jest-mock-extended";
import "jest-localstorage-mock";

jest.mock("@gitcoin/passport-identity/dist/commonjs/src/credentials", () => ({
  fetchVerifiableCredential: jest.fn(),
}));
jest.mock("../../utils/onboard.ts");

const mockHandleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const mockHandleAddStamp = jest.fn().mockResolvedValue(undefined);
const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;

const mockUserContext: UserContextState = makeTestUserContext({
  userArrivalSource: UserArrivalSourceState.Unknown,
  handleConnection: mockHandleConnection,
  address: mockAddress,
  signer: mockSigner,
});

const mockCeramicContext: CeramicContextState = makeTestCeramicContext({
  handleCreatePassport: mockCreatePassport,
  handleAddStamp: mockHandleAddStamp,
});

let props: ReturnModalProps;

const setItemSpy = jest.spyOn(window.localStorage, "setItem");
const getItemSpy = jest.spyOn(window.localStorage, "getItem");

beforeEach(() => {
  props = {
    isOpen: true,
    onClose: jest.fn(),
  };
  localStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

afterAll(() => {
  getItemSpy.mockRestore();
  setItemSpy.mockRestore();
});

describe("Modal", () => {
  it("should show when checkbox is not checked", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <ReturnModal {...props} />);

    expect(screen.getByTestId("return-modal")).toBeInTheDocument();
  });

  it("should NOT show when checkbox is checked", () => {
    getItemSpy.mockReturnValueOnce("true");
    renderWithContext(mockUserContext, mockCeramicContext, <ReturnModal {...props} />);

    expect(screen.queryByTestId("return-modal")).not.toBeInTheDocument();
  });
});

describe("Modal Footer Buttons ", () => {
  it("when user was redirected from trust bonus show a return button that redirects to trust bonus page", () => {
    renderWithContext(
      {
        ...mockUserContext,
        userArrivalSource: UserArrivalSourceState.Known,
      },
      mockCeramicContext,
      <ReturnModal {...props} />
    );

    screen.getByTestId("return-modal-return-button").click();
    expect(props.onClose).toHaveBeenCalled();
  });

  it("when user was NOT redirected from trust bonus show a done button that calls onClose", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <ReturnModal {...props} />);

    screen.getByTestId("return-modal-done-button").click();
    expect(props.onClose).toHaveBeenCalled();
  });
});
