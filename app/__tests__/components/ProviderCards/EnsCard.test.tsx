import React from "react";
import { fireEvent, screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { EnsCard } from "../../../components/ProviderCards";

import { UserContextState } from "../../../context/userContext";
import { CeramicContextState } from "../../../context/ceramicContext";
import { mockAddress } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { ensStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import { SUCCESFUL_ENS_RESULT } from "../../../__test-fixtures__/verifiableCredentialResults";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../../__test-fixtures__/contextTestHelpers";
import { JsonRpcSigner } from "@ethersproject/providers";
import { mock } from "jest-mock-extended";

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

describe("when user has not verified with EnsProvider", () => {
  it("should display a verification button", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <EnsCard />);

    const initialVerifyButton = screen.queryByTestId("button-verify-ens");

    expect(initialVerifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with EnsProvider", () => {
  it("should display that ens is verified", () => {
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        allProvidersState: {
          Ens: {
            providerSpec: STAMP_PROVIDERS.Ens,
            stamp: ensStampFixture,
          },
        },
      },
      <EnsCard />
    );

    const ensVerified = screen.queryByText(/Verified/);

    expect(ensVerified).toBeInTheDocument();
  });
});

describe("when the verify button is clicked", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("and when a successful ENS result is returned", () => {
    beforeEach(() => {
      (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFUL_ENS_RESULT);
    });

    it("the modal displays the verify button", async () => {
      renderWithContext(mockUserContext, mockCeramicContext, <EnsCard />);

      const initialVerifyButton = screen.queryByTestId("button-verify-ens");

      fireEvent.click(initialVerifyButton!);

      expect(fetchVerifiableCredential).toHaveBeenLastCalledWith(
        process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "",
        {
          type: "Ens",
          version: "0.0.0",
          address: mockAddress,
          proofs: {
            valid: "true",
          },
        },
        mockSigner
      );

      const verifyModal = await screen.findByRole("dialog");
      const verifyModalButton = screen.getByTestId("modal-verify-btn");

      expect(verifyModal).toBeInTheDocument();

      await waitFor(() => {
        expect(verifyModalButton).toBeInTheDocument();
      });
    });

    it("clicking verify adds the stamp", async () => {
      renderWithContext(mockUserContext, mockCeramicContext, <EnsCard />);

      const initialVerifyButton = screen.queryByTestId("button-verify-ens");

      // Click verify button on ens card
      fireEvent.click(initialVerifyButton!);

      // Wait to see the verify button on the modal
      await waitFor(() => {
        const verifyModalButton = screen.getByTestId("modal-verify-btn");
        expect(verifyModalButton).toBeInTheDocument();
      });

      const finalVerifyButton = screen.queryByRole("button", {
        name: /Verify/,
      });

      // Click the verify button on modal
      fireEvent.click(finalVerifyButton!);

      await waitFor(() => {
        expect(mockHandleAddStamp).toBeCalled();
      });

      // Wait to see the done toast
      await waitFor(() => {
        const doneToast = screen.getByTestId("toast-done-ens");
        expect(doneToast).toBeInTheDocument();
      });
    });

    it("clicking cancel closes the modal and a stamp should not be added", async () => {
      (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFUL_ENS_RESULT);
      renderWithContext(mockUserContext, mockCeramicContext, <EnsCard />);

      const initialVerifyButton = screen.queryByTestId("button-verify-ens");

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

  describe("and when a failed ENS result is returned", () => {
    it("modal displays a failed message", async () => {
      (fetchVerifiableCredential as jest.Mock).mockRejectedValue("ERROR");
      renderWithContext(mockUserContext, mockCeramicContext, <EnsCard />);

      const initialVerifyButton = screen.queryByTestId("button-verify-ens");

      fireEvent.click(initialVerifyButton!);

      const verifyModal = await screen.findByRole("dialog");
      const verifyModalText = screen.getByText("Your address does not have an ENS domain associated");

      expect(verifyModal).toBeInTheDocument();

      await waitFor(() => {
        expect(verifyModalText).toBeInTheDocument();
      });
    });
  });
});
