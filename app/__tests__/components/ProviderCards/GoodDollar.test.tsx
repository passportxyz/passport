import React from "react";
import { Router, MemoryRouter } from "react-router-dom";
import { createMemoryHistory } from "history";
import { screen, fireEvent, waitFor, act } from "@testing-library/react";
import { GoodDollarCard } from "../../../components/ProviderCards";

import { UserContext, UserContextState } from "../../../context/userContext";
import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { gooddollarStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import { SUCCESFULL_GOODDOLLAR_RESULT } from "../../../__test-fixtures__/verifiableCredentialResults";
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
  userDid: "mockUserDid",
  handleCreatePassport: mockCreatePassport,
  handleAddStamp: mockHandleAddStamp,
});

export const sampleGooddollarSignedObject = {
  a: { value: "0x9E6Ea049A281F513a2BAbb106AF1E023FEEeCfA9", attestation: "" },
  v: { value: true, attestation: "" },
  I: { value: "India", attestation: "" },
  n: { value: "Harjaap Dhillon", attestation: "" },
  e: { value: "harvydhillon16@gmail.com", attestation: "" },
  m: { value: "+918146851290", attestation: "" },
  nonce: { value: Date.now(), attestation: "" },
  sig: "0xadbf6657ff309f9f25dddf72d2d04ec3b0af053b2db9121910f79ea82bce486e1db26ea639670fa1600ce862e209845e1d2a73ad7a4a4e858a80dfa33f79e0ef1c",
};

export const sampleBadGooddollarSignedObject = {
  error: "Authorization Denied",
};

const history = createMemoryHistory();

describe("when user has not verfied with GoodDollarProvider", () => {
  it("should display a verification button", async () => {
    await act(async () =>
      renderWithContext(
        mockUserContext,
        mockCeramicContext,
        <Router location={history.location} navigator={history}>
          <UserContext.Provider value={mockUserContext}>
            <GoodDollarCard />
          </UserContext.Provider>
        </Router>
      )
    );

    const verifyButton = screen.queryByTestId("button-getverified-gooddollar");

    expect(verifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with GoodDollarProvider", () => {
  it("should display is verified", async () => {
    await act(async () =>
      renderWithContext(
        mockUserContext,
        {
          ...mockCeramicContext,
          allProvidersState: {
            GoodDollar: {
              providerSpec: STAMP_PROVIDERS.GoodDollar,
              stamp: gooddollarStampFixture,
            },
          },
        },
        <Router location={history.location} navigator={history}>
          <GoodDollarCard />
        </Router>
      )
    );

    const verified = screen.getByText("Verified");

    expect(verified).toBeInTheDocument();
  });
});

describe("when the verify button is clicked", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("it should redirect to gooddollar login screen ", async () => {
    await act(async () =>
      renderWithContext(
        mockUserContext,
        mockCeramicContext,
        <Router location={history.location} navigator={history}>
          <GoodDollarCard />
        </Router>
      )
    );

    const initialVerifyButton = screen.queryByTestId("button-getverified-gooddollar");

    fireEvent.click(initialVerifyButton!);

    const verifyButton = screen.queryByTestId("button-verify-gooddollar");

    fireEvent.click(verifyButton!);

    expect(window.location.toString().includes("LoginRedirect")).toBeTruthy();
  });

  describe("and when a successful GoodDollar result is returned", () => {
    beforeEach(() => {
      (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFULL_GOODDOLLAR_RESULT);
    });

    it("after returned from succesfull login, VC is issued and stamp is added after which the success toast is displayed ", async () => {
      window.location.assign(
        "http://localhost/dashboard?login=" +
          Buffer.from(JSON.stringify(sampleGooddollarSignedObject)).toString("base64")
      );
      history.push("/dashboard?login=" + Buffer.from(JSON.stringify(sampleGooddollarSignedObject)).toString("base64"));
      await act(
        async () =>
          renderWithContext(
            mockUserContext,
            mockCeramicContext,
            <Router location={history.location} navigator={history}>
              <GoodDollarCard />
            </Router>
          ) as any
      );

      // Wait to see the verify button on the modal
      await waitFor(
        () => {
          const verifyModalButton = screen.getByTestId("modal-verify-btn");
          expect(verifyModalButton).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Click the verify button on modal
      fireEvent.click(screen.getByTestId("modal-verify-btn"));

      await waitFor(() => {
        expect(mockHandleAddStamp).toBeCalled();
      });

      await waitFor(() => {
        const doneToast = screen.getByTestId("toast-done-gooddollar");
        expect(doneToast).toBeInTheDocument();
      });
    });
  });

  describe("and when verifying returns an error", () => {
    it("after invalid login result, failure toast is displayed ", async () => {
      window.location.assign(
        "http://localhost/#/dashboard?login=" +
          Buffer.from(JSON.stringify(sampleBadGooddollarSignedObject)).toString("base64")
      );

      await act(
        async () =>
          renderWithContext(
            mockUserContext,
            mockCeramicContext,
            <MemoryRouter
              initialEntries={[
                "/dashboard?login=" + Buffer.from(JSON.stringify(sampleBadGooddollarSignedObject)).toString("base64"),
              ]}
              initialIndex={0}
            >
              <GoodDollarCard />
            </MemoryRouter>
          ) as any
      );

      await waitFor(
        () => {
          const doneToast = screen.getByText("Request to login was denied!");
          expect(doneToast).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });

    it("during fetchingVC, a verification error occurs", async () => {
      (fetchVerifiableCredential as jest.Mock).mockRejectedValue("ERROR");

      window.location.assign(
        "http://localhost/dashboard?login=" +
          Buffer.from(JSON.stringify(sampleGooddollarSignedObject)).toString("base64")
      );
      history.push("/dashboard?login=" + Buffer.from(JSON.stringify(sampleGooddollarSignedObject)).toString("base64"));

      await act(
        async () =>
          renderWithContext(
            mockUserContext,
            mockCeramicContext,
            <Router location={history.location} navigator={history}>
              <GoodDollarCard />
            </Router>
          ) as any
      );

      await waitFor(
        () => {
          const doneToast = screen.getByText("Your GoodDollar verification failed. Try again!");
          expect(doneToast).toBeInTheDocument();
        },
        { timeout: 2000 }
      );
    });
  });
});
