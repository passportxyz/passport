import React from "react";
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { BrightidCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { brightidStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import { SUCCESFUL_BRIGHTID_RESULT } from "../../../__test-fixtures__/verifiableCredentialResults";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

jest.mock("@gitcoin/passport-identity/dist/commonjs/src/credentials", () => ({
  fetchVerifiableCredential: jest.fn(),
}));
jest.mock("../../../utils/onboard.ts");

const mockHandleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const handleAddStamp = jest.fn().mockResolvedValue(undefined);
const mockUserContext: UserContextState = {
  userDid: "mockUserDid",
  loggedIn: true,
  passport: {
    issuanceDate: new Date(),
    expiryDate: new Date(),
    stamps: [],
  },
  isLoadingPassport: false,
  allProvidersState: {
    Brightid: {
      providerSpec: STAMP_PROVIDERS.Brightid,
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

function setupFetchStub(valid: any) {
  return function fetchStub(_url: any) {
    return new Promise((resolve) => {
      resolve({
        json: () =>
          Promise.resolve({
            response: { valid },
          }),
      });
    });
  };
}

describe("when user has not verfied with BrightId Provider", () => {
  it("should display a verify button", () => {
    render(
      <UserContext.Provider value={mockUserContext}>
        <BrightidCard />
      </UserContext.Provider>
    );

    const initialVerifyButton = screen.queryByTestId("button-verify-brightid");

    expect(initialVerifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with BrightId Provider", () => {
  it("should display that a verified credential was returned", () => {
    render(
      <UserContext.Provider
        value={{
          ...mockUserContext,
          allProvidersState: {
            Brightid: {
              providerSpec: STAMP_PROVIDERS.Brightid,
              stamp: brightidStampFixture,
            },
          },
        }}
      >
        <BrightidCard />
      </UserContext.Provider>
    );

    const brightidVerified = screen.queryByText(/Verified/);

    expect(brightidVerified).toBeInTheDocument();
  });
});

describe("when the verify button is clicked", () => {
  let originalFetch: any;
  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn().mockImplementation(setupFetchStub(true));
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe("and when a successful BrightId result is returned", () => {
    beforeEach(() => {
      (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFUL_BRIGHTID_RESULT);
    });

    it("the modal displays the verify button", async () => {
      render(
        <UserContext.Provider value={mockUserContext}>
          <BrightidCard />
        </UserContext.Provider>
      );

      const initialVerifyButton = screen.queryByTestId("button-verify-brightid");

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
          <BrightidCard />
        </UserContext.Provider>
      );

      const initialVerifyButton = screen.queryByTestId("button-verify-brightid");

      // Click verify button on brightid card
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
        const doneToast = screen.getByTestId("toast-done-brightid");
        expect(doneToast).toBeInTheDocument();
      });
    });

    it("clicking cancel closes the modal and a stamp should not be added", async () => {
      (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFUL_BRIGHTID_RESULT);
      render(
        <UserContext.Provider value={mockUserContext}>
          <BrightidCard />
        </UserContext.Provider>
      );

      const initialVerifyButton = screen.queryByTestId("button-verify-brightid");

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

  describe("and when a failed Bright Id result is returned", () => {
    it("modal displays steps to get sponsored", async () => {
      global.fetch = jest.fn().mockImplementation(setupFetchStub(false));
      (fetchVerifiableCredential as jest.Mock).mockRejectedValue("ERROR");
      render(
        <UserContext.Provider value={mockUserContext}>
          <BrightidCard />
        </UserContext.Provider>
      );

      const initialVerifyButton = screen.queryByTestId("button-verify-brightid");

      fireEvent.click(initialVerifyButton!);

      const verifyModal = await screen.findByRole("dialog");
      const triggerSponsorButton = screen.queryByTestId("button-sponsor-brightid");
      const verifyModalText = screen.queryByTestId("brightid-modal-step1");

      expect(verifyModal).toBeInTheDocument();
      await waitFor(() => {
        expect(verifyModalText).toBeInTheDocument();
      });
      expect(triggerSponsorButton).toBeInTheDocument();
    });
  });
});
