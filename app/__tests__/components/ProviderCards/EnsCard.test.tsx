import React from "react";
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { EnsCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { ensStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import { SUCCESFUL_ENS_RESULT } from "../../../__test-fixtures__/verifiableCredentialResults";
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
    Ens: {
      providerSpec: STAMP_PROVIDERS.Ens,
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

describe("when user has not verfied with EnsProvider", () => {
  it("should display a verification button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <EnsCard />
      </UserContext.Provider>
    );

    const initialVerifyButton = screen.queryByTestId("button-verify-ens");

    expect(initialVerifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with EnsProvider", () => {
  it("should display that ens is verified", () => {
    render(
      <UserContext.Provider
        value={{
          ...mockUserContext,
          allProvidersState: {
            Ens: {
              providerSpec: STAMP_PROVIDERS.Ens,
              stamp: ensStampFixture,
            },
          },
        }}
      >
        <EnsCard />
      </UserContext.Provider>
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
      render(
        <UserContext.Provider value={mockUserContext}>
          <EnsCard />
        </UserContext.Provider>
      );

      const initialVerifyButton = screen.queryByTestId("button-verify-ens");

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
          <EnsCard />
        </UserContext.Provider>
      );

      const initialVerifyButton = screen.queryByTestId("button-verify-ens");

      // Click verify button on ens card
      fireEvent.click(initialVerifyButton!);

      // Wait to see the verify button on the modal
      await waitFor(() => {
        const verifyModalButton = screen.getByTestId("modal-verify");
        expect(verifyModalButton).toBeInTheDocument();
      });

      const finalVerifyButton = screen.queryByRole("button", {
        name: /Verify/,
      });

      // Click the verify button on modal
      fireEvent.click(finalVerifyButton!);

      await waitFor(() => {
        expect(handleAddStamp).toBeCalled();
      });

      // Wait to see the done toast
      await waitFor(() => {
        const doneToast = screen.getByTestId("toast-done-ens");
        expect(doneToast).toBeInTheDocument();
      });
    });

    it("clicking cancel closes the modal and a stamp should not be added", async () => {
      (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFUL_ENS_RESULT);
      render(
        <UserContext.Provider value={mockUserContext}>
          <EnsCard />
        </UserContext.Provider>
      );

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

      expect(handleAddStamp).not.toBeCalled();

      await waitForElementToBeRemoved(modalCancelButton);
      expect(modalCancelButton).not.toBeInTheDocument();
    });
  });

  describe("and when a failed ENS result is returned", () => {
    it("modal displays a failed message", async () => {
      (fetchVerifiableCredential as jest.Mock).mockRejectedValue("ERROR");
      render(
        <UserContext.Provider value={mockUserContext}>
          <EnsCard />
        </UserContext.Provider>
      );

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
