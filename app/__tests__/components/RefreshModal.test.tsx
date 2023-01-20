import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { mockAddress } from "../../__test-fixtures__/onboardHookValues";
import { RefreshStampModal } from "../../components/RefreshStampModal";
import { UserContextState } from "../../context/userContext";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";
import { JsonRpcSigner } from "@ethersproject/providers";
import { mock } from "jest-mock-extended";
import { CeramicContextState } from "../../context/ceramicContext";

jest.mock("../../utils/onboard.ts");

const mockHandleConnection = jest.fn();
const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;

const mockUserContext: UserContextState = makeTestUserContext({
  handleConnection: mockHandleConnection,
  address: mockAddress,
  signer: mockSigner,
});
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("RefreshStampModal", () => {
  it("should attempt to refresh a passport once rendered", async () => {
    const refreshRequest = jest.spyOn(mockCeramicContext, "handleCheckRefreshPassport").mockResolvedValue(true);
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        ceramicErrors: {
          error: true,
          stamps: ["streamid"],
        },
      },
      <RefreshStampModal isOpen={true} onClose={jest.fn()} />
    );

    await waitFor(() => expect(refreshRequest).toHaveBeenCalled());
  });

  it("should indicate to progress component that streams have been refreshed", async () => {
    jest.spyOn(mockCeramicContext, "handleCheckRefreshPassport").mockResolvedValue(true);
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        ceramicErrors: {
          error: true,
          stamps: ["streamid"],
        },
      },
      <RefreshStampModal isOpen={true} onClose={jest.fn()} />
    );

    await waitFor(() => expect(screen.getAllByAltText("completed icon")).toHaveLength(2));
  });

  it("should indicate to progress component that there was an error refreshing stamps", async () => {
    jest.spyOn(mockCeramicContext, "handleCheckRefreshPassport").mockResolvedValue(false);
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        ceramicErrors: {
          error: true,
          stamps: ["streamid"],
        },
      },
      <RefreshStampModal isOpen={true} onClose={jest.fn()} />
    );

    await waitFor(() => expect(screen.getAllByAltText("error icon")).toHaveLength(1));
  });
});
