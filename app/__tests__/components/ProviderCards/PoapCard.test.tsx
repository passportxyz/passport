import React from "react";
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { PoapCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { poapStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import { SUCCESFUL_POAP_RESULT } from "../../../__test-fixtures__/verifiableCredentialResults";
import { fetchVerifiableCredential } from "@dpopp/identity/dist/commonjs";

jest.mock("@dpopp/identity/dist/commonjs", () => ({
  fetchVerifiableCredential: jest.fn(),
}));
jest.mock("../../../utils/onboard.ts");

const mockHandleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const handleAddStamp = jest.fn();
const mockUserContext: UserContextState = {
  loggedIn: true,
  passport: undefined,
  isLoadingPassport: false,
  allProvidersState: {
    POAP: {
      providerSpec: STAMP_PROVIDERS.POAP,
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

describe("when user has not verified with PoapProvider", () => {
  it("should display a verification button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <PoapCard />
      </UserContext.Provider>
    );

    const verifyButton = screen.queryByTestId("button-verify-poap");

    expect(verifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with PoapProvider", () => {
  it("should display that POAP is verified", () => {
    render(
      <UserContext.Provider
        value={{
          ...mockUserContext,
          allProvidersState: {
            POAP: {
              providerSpec: STAMP_PROVIDERS.POAP,
              stamp: poapStampFixture,
            },
          },
        }}
      >
        <PoapCard />
      </UserContext.Provider>
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
      render(
        <UserContext.Provider value={mockUserContext}>
          <PoapCard />
        </UserContext.Provider>
      );

      const initialVerifyButton = screen.queryByRole("button", {
        name: /Verify/,
      });

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
          <PoapCard />
        </UserContext.Provider>
      );

      const initialVerifyButton = screen.queryByRole("button", {
        name: /Verify/,
      });

      // Click verify button on poap card
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

      expect(handleAddStamp).toBeCalled();
    });

    it("clicking cancel closes the modal and a stamp should not be added", async () => {
      (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFUL_POAP_RESULT);
      render(
        <UserContext.Provider value={mockUserContext}>
          <PoapCard />
        </UserContext.Provider>
      );

      const initialVerifyButton = screen.queryByRole("button", {
        name: /Verify/,
      });

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

  describe("and when a failed POAP result is returned", () => {
    it("modal displays a failed message", async () => {
      (fetchVerifiableCredential as jest.Mock).mockRejectedValue("ERROR");
      render(
        <UserContext.Provider value={mockUserContext}>
          <PoapCard />
        </UserContext.Provider>
      );

      const initialVerifyButton = screen.queryByRole("button", {
        name: /Verify/,
      });

      fireEvent.click(initialVerifyButton!);

      const verifyModal = await screen.findByRole("dialog");
      const verifyModalText = screen.getByText("Your address does not have an POAP associated older than 15 days");

      expect(verifyModal).toBeInTheDocument();

      await waitFor(() => {
        expect(verifyModalText).toBeInTheDocument();
      });
    });
  });
});
