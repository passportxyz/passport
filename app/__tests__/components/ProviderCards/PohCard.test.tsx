import React from "react";
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { PohCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { pohStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import { SUCCESFUL_POH_RESULT } from "../../../__test-fixtures__/verifiableCredentialResults";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

jest.mock("@gitcoin/passport-identity/dist/commonjs/src/credentials", () => ({
  fetchVerifiableCredential: jest.fn(),
}));
jest.mock("../../../utils/onboard.ts");

const mockHandleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const handleAddStamp = jest.fn().mockResolvedValue(undefined);
const mockUserContext: UserContextState = {
  userDid: undefined,
  loggedIn: true,
  passport: {
    issuanceDate: new Date(),
    expiryDate: new Date(),
    stamps: [],
  },
  isLoadingPassport: false,
  allProvidersState: {
    Poh: {
      providerSpec: STAMP_PROVIDERS.Poh,
      stamp: undefined,
    },
  },
  handleAddStamp: handleAddStamp,
  handleCreatePassport: mockCreatePassport,
  handleConnection: mockHandleConnection,
  address: mockAddress,
  wallet: mockWallet,
  signer: undefined,
  walletLabel: mockWallet.label,
};

describe("when user has not verfied with PohProvider", () => {
  it("should display a verification button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <PohCard />
      </UserContext.Provider>
    );

    const verifyButton = screen.queryByTestId("button-verify-poh");

    expect(verifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with PohProvider", () => {
  it("should display is verified", () => {
    render(
      <UserContext.Provider
        value={{
          ...mockUserContext,
          allProvidersState: {
            Poh: {
              providerSpec: STAMP_PROVIDERS.Poh,
              stamp: pohStampFixture,
            },
          },
        }}
      >
        <PohCard />
      </UserContext.Provider>
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
      render(
        <UserContext.Provider value={mockUserContext}>
          <PohCard />
        </UserContext.Provider>
      );

      const initialVerifyButton = screen.queryByTestId("button-verify-poh");

      fireEvent.click(initialVerifyButton!);

      const verifyModal = await screen.findByRole("dialog");
      const verifyModalButton = screen.getByTestId("modal-verify");

      expect(verifyModal).toBeInTheDocument();

      await waitFor(() => {
        expect(verifyModalButton).toBeInTheDocument();
      });
    });

    it("clicking verify adds the stamp", async () => {
      render(
        <UserContext.Provider value={mockUserContext}>
          <PohCard />
        </UserContext.Provider>
      );

      const initialVerifyButton = screen.queryByTestId("button-verify-poh");

      // Click verify button on poh card
      fireEvent.click(initialVerifyButton!);

      // Wait to see the verify button on the modal
      await waitFor(() => {
        const verifyModalButton = screen.getByTestId("modal-verify");
        expect(verifyModalButton).toBeInTheDocument();
      });

      // Click the verify button on modal
      fireEvent.click(screen.getByTestId("modal-verify"));

      await waitFor(() => {
        expect(handleAddStamp).toBeCalled();
      });

      // Wait to see the done toast
      await waitFor(() => {
        const doneToast = screen.getByTestId("toast-done-poh");
        expect(doneToast).toBeInTheDocument();
      });
    });

    it("clicking cancel closes the modal and a stamp should not be added", async () => {
      (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFUL_POH_RESULT);
      render(
        <UserContext.Provider value={mockUserContext}>
          <PohCard />
        </UserContext.Provider>
      );

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

      expect(handleAddStamp).not.toBeCalled();

      await waitForElementToBeRemoved(modalCancelButton);
      expect(modalCancelButton).not.toBeInTheDocument();
    });
  });

  describe("and when a failed POH result is returned", () => {
    it("modal displays a failed message", async () => {
      (fetchVerifiableCredential as jest.Mock).mockRejectedValue("ERROR");
      render(
        <UserContext.Provider value={mockUserContext}>
          <PohCard />
        </UserContext.Provider>
      );

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
