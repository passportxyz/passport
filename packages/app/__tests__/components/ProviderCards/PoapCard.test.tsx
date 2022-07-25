import React from "react";
import { fireEvent, screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { PoapCard } from "../../../components/ProviderCards";

import { UserContextState } from "../../../context/userContext";
import { mockAddress } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { poapStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import { SUCCESFUL_POAP_RESULT } from "../../../__test-fixtures__/verifiableCredentialResults";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../../context/ceramicContext";
import { mock } from "jest-mock-extended";
import { JsonRpcSigner } from "@ethersproject/providers";

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

describe("when user has not verified with PoapProvider", () => {
  it("should display a verification button", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <PoapCard />);

    const initialVerifyButton = screen.queryByTestId("button-verify-poap");

    expect(initialVerifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with PoapProvider", () => {
  it("should display that POAP is verified", () => {
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        allProvidersState: {
          POAP: {
            providerSpec: STAMP_PROVIDERS.POAP,
            stamp: poapStampFixture,
          },
        },
      },
      <PoapCard />
    );

    const poapVerified = screen.queryByText(/Verified/);

    expect(poapVerified).toBeInTheDocument();
  });
});

describe("when the verify button is clicked", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("and when a successful POAP result is returned", () => {
    beforeEach(() => {
      (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFUL_POAP_RESULT);
    });

    it("the modal displays the verify button", async () => {
      renderWithContext(mockUserContext, mockCeramicContext, <PoapCard />);

      const initialVerifyButton = screen.queryByTestId("button-verify-poap");

      fireEvent.click(initialVerifyButton!);

      const verifyModal = await screen.findByRole("dialog");
      const verifyModalButton = screen.getByTestId("modal-verify-btn");

      expect(verifyModal).toBeInTheDocument();

      await waitFor(() => {
        expect(verifyModalButton).toBeInTheDocument();
      });
    });

    it("clicking verify adds the stamp", async () => {
      renderWithContext(mockUserContext, mockCeramicContext, <PoapCard />);

      const initialVerifyButton = screen.queryByTestId("button-verify-poap");

      // Click verify button on POAP card
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
        const doneToast = screen.getByTestId("toast-done-poap");
        expect(doneToast).toBeInTheDocument();
      });
    });

    it("clicking cancel closes the modal and a stamp should not be added", async () => {
      (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFUL_POAP_RESULT);
      renderWithContext(mockUserContext, mockCeramicContext, <PoapCard />);

      const initialVerifyButton = screen.queryByTestId("button-verify-poap");

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

  describe("and when a failed POAP result is returned", () => {
    it("modal displays a failed message", async () => {
      (fetchVerifiableCredential as jest.Mock).mockRejectedValue("ERROR");
      renderWithContext(mockUserContext, mockCeramicContext, <PoapCard />);

      const initialVerifyButton = screen.queryByTestId("button-verify-poap");

      fireEvent.click(initialVerifyButton!);

      const verifyModal = await screen.findByRole("dialog");
      expect(verifyModal).toBeInTheDocument();

      expect(
        screen.getByText("We checked for POAP badges and did not find POAP badge(s) that are 15 or more days old.")
      );

      expect(screen.getByText("Go to POAP"));

      expect(screen.getByText("Cancel"));
    });
  });
});
