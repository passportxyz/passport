import React from "react";
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { PohCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { pohStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import { SUCCESFUL_POH_RESULT } from "../../../__test-fixtures__/verifiableCredentialResults";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";
import { mock } from "jest-mock-extended";
import { JsonRpcSigner } from "@ethersproject/providers";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../../context/ceramicContext";

jest.mock("@gitcoin/passport-identity/dist/commonjs/src/credentials", () => ({
  fetchVerifiableCredential: jest.fn(),
}));
jest.mock("../../../utils/onboard.ts");

const mockHandleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const mockHandleAddStamp = jest.fn().mockResolvedValue(undefined);
const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;

const mockUserContext: UserContextState = makeTestUserContext({
  handleConnection: mockHandleConnection,
  address: mockAddress,
  signer: mockSigner,
});
const mockCeramicContext: CeramicContextState = makeTestCeramicContext({
  handleCreatePassport: mockCreatePassport,
  handleAddStamp: mockHandleAddStamp,
});

describe("when user has not verified with PohProvider", () => {
  it("should display a verification button", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <PohCard />);

    const verifyButton = screen.queryByTestId("button-verify-poh");

    expect(verifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with PohProvider", () => {
  it("should display is verified", () => {
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        allProvidersState: {
          Poh: {
            providerSpec: STAMP_PROVIDERS.Poh,
            stamp: pohStampFixture,
          },
        },
      },
      <PohCard />
    );

    const verified = screen.queryByText(/Verified/);

    expect(verified).toBeInTheDocument();
  });
});

describe("when the verify button is clicked", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("and when a successful POH result is returned", () => {
    beforeEach(() => {
      (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFUL_POH_RESULT);
    });

    it("the modal displays the verify button", async () => {
      renderWithContext(mockUserContext, mockCeramicContext, <PohCard />);

      const initialVerifyButton = screen.queryByTestId("button-verify-poh");

      fireEvent.click(initialVerifyButton!);

      const verifyModal = await screen.findByRole("dialog");
      expect(verifyModal).toBeInTheDocument();

      expect(screen.getByTestId("modal-verify-btn"));
    });

    it("clicking verify adds the stamp", async () => {
      mockHandleAddStamp.mockResolvedValue('reeeee')
      renderWithContext(mockUserContext, mockCeramicContext, <PohCard />);

      const initialVerifyButton = screen.queryByTestId("button-verify-poh");

      // Click verify button on poh card
      fireEvent.click(initialVerifyButton!);

      // Wait to see the verify button on the modal
      await waitFor(() => {
        const verifyModalButton = screen.getByTestId("modal-verify-btn");
        expect(verifyModalButton).toBeInTheDocument();
      });

      // Click the verify button on modal
      fireEvent.click(screen.getByTestId("modal-verify-btn"));

      await waitFor(() => {
        expect(mockHandleAddStamp).toBeCalled();
      });

      // Wait to see the done toast
      await waitFor(() => {
        const doneToast = screen.getByTestId("toast-done-poh");
        expect(doneToast).toBeInTheDocument();
      });
    });

    it("clicking cancel closes the modal and a stamp should not be added", async () => {
      (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFUL_POH_RESULT);
      renderWithContext(mockUserContext, mockCeramicContext, <PohCard />);

      const initialVerifyButton = screen.queryByTestId("button-verify-poh");

      fireEvent.click(initialVerifyButton!);

      // Wait to see the cancel button on the modal
      let modalCancelButton: HTMLElement | null = null;
      await waitFor(() => {
        modalCancelButton = screen.queryByRole("button", {
          name: /Cancel/,
        });
        expect(modalCancelButton).toBeInTheDocument();
      });

      fireEvent.click(modalCancelButton!);

      expect(mockHandleAddStamp).not.toBeCalled();

      await waitForElementToBeRemoved(modalCancelButton);
      expect(modalCancelButton).not.toBeInTheDocument();
    });
  });

  describe("and when a failed POH result is returned", () => {
    it("modal displays a failed message", async () => {
      (fetchVerifiableCredential as jest.Mock).mockRejectedValue("ERROR");
      renderWithContext(mockUserContext, mockCeramicContext, <PohCard />);

      const initialVerifyButton = screen.queryByTestId("button-verify-poh");

      fireEvent.click(initialVerifyButton!);

      const verifyModal = await screen.findByRole("dialog");
      const verifyModalText = screen.getByText("The Proof of Humanity Status for this address Is not Registered");

      expect(verifyModal).toBeInTheDocument();

      await waitFor(() => {
        expect(verifyModalText).toBeInTheDocument();
      });
    });
  });
});
