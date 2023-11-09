import React from "react";
import { render, screen, fireEvent, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { BrightidCard } from "../../../components/PlatformCards";

import { mockAddress, mockWallet } from "../../../__test-fixtures__/onboardHookValues";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { brightidStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import { SUCCESFUL_BRIGHTID_RESULT } from "../../../__test-fixtures__/verifiableCredentialResults";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";
import { mock } from "jest-mock-extended";
import { JsonRpcSigner } from "@ethersproject/providers";
import { makeTestCeramicContext, renderWithContext } from "../../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../../context/ceramicContext";

jest.mock("@gitcoin/passport-identity/dist/commonjs/src/credentials", () => ({
  fetchVerifiableCredential: jest.fn(),
}));

const mockToggleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const mockHandleAddStamp = jest.fn().mockResolvedValue(undefined);
const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;

const mockCeramicContext: CeramicContextState = makeTestCeramicContext({
  userDid: "mockUserDid",
  handleCreatePassport: mockCreatePassport,
  handleAddStamp: mockHandleAddStamp,
});

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
    // renderWithContext(mockUserContext, mockCeramicContext, <BrightidCard />);
    // const initialVerifyButton = screen.queryByTestId("button-verify-brightid");
    // expect(initialVerifyButton).toBeInTheDocument();
  });
});

// describe("when user has verified with BrightId Provider", () => {
//   it("should display that a verified credential was returned", () => {
//     renderWithContext(
//       mockUserContext,
//       {
//         ...mockCeramicContext,
//         allProvidersState: {
//           Brightid: {
//             providerSpec: STAMP_PROVIDERS.Brightid,
//             stamp: brightidStampFixture,
//           },
//         },
//       },
//       <BrightidCard />
//     );

//     const brightidVerified = screen.queryByText(/Verified/);

//     expect(brightidVerified).toBeInTheDocument();
//   });

//   it("should be able to delete the stamp", async () => {
//     const mockHandleDeleteStamp = jest.fn().mockResolvedValue(undefined);

//     const mockCeramicContext: CeramicContextState = makeTestCeramicContext({
//       handleDeleteStamp: mockHandleDeleteStamp,
//     });

//     mockCeramicContext.allProvidersState.Brightid = {
//       providerSpec: STAMP_PROVIDERS.Brightid,
//       stamp: {
//         provider: "Brightid",
//         streamId: "STREAM-ID",

//         credential: {
//           type: ["VerifiableCredential"],
//           proof: {
//             jws: "this is the jws",
//             type: "Ed25519Signature2018",
//             created: "2022-07-01T11:02:03.186Z",
//             proofPurpose: "assertionMethod",
//             verificationMethod: "did:key:klsdhcu263789gd870237gd8ewg7823#,dsjnbjklhy923769-dhskjcjsdky8973",
//           },
//           issuer: "did:key:cdsmlkanfosiu892738921374923ure",
//           "@context": ["https://www.w3.org/2018/credentials/v1"],
//           issuanceDate: "2022-07-21T11:02:03.185Z",
//           expirationDate: "2022-10-19T11:02:03.185Z",
//           credentialSubject: {
//             id: "did:pkh:eip155:1:0xojicsd86238hdsiy89q7e",
//             hash: "v0.0.0:cdsdnkowu827380dsfhfoushfousd",
//             "@context": [{ hash: "https://schema.org/Text", provider: "https://schema.org/Text" }],
//             provider: "Brightid",
//           },
//         },
//       },
//     };

//     renderWithContext(mockUserContext, mockCeramicContext, <BrightidCard />);

//     // Open menu (click the menu button)
//     const menuButton = screen.queryByTestId("card-menu-button");
//     fireEvent.click(menuButton!);

//     // Click the delete option
//     const deleteMenuOption = screen.queryByTestId("remove-stamp");
//     fireEvent.click(deleteMenuOption!);

//     expect(mockHandleDeleteStamp).toBeCalledWith("STREAM-ID");
//   });
// });

// describe("when the verify button is clicked", () => {
//   let originalFetch: any;
//   beforeEach(() => {
//     originalFetch = global.fetch;
//     global.fetch = jest.fn().mockImplementation(setupFetchStub(true));
//   });

//   afterEach(() => {
//     global.fetch = originalFetch;
//     jest.clearAllMocks();
//   });

//   describe("and when a successful BrightId result is returned", () => {
//     beforeEach(() => {
//       (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFUL_BRIGHTID_RESULT);
//     });

//     it("the modal displays the verify button", async () => {
//       renderWithContext(mockUserContext, mockCeramicContext, <BrightidCard />);

//       const initialVerifyButton = screen.queryByTestId("button-verify-brightid");

//       fireEvent.click(initialVerifyButton!);

//       const verifyModal = await screen.findByRole("dialog");
//       const verifyModalButton = screen.getByTestId("modal-verify-btn");

//       expect(verifyModal).toBeInTheDocument();

//       await waitFor(() => {
//         expect(verifyModalButton).toBeInTheDocument();
//       });
//     });

//     it("clicking verify adds the stamp", async () => {
//       renderWithContext(mockUserContext, mockCeramicContext, <BrightidCard />);

//       const initialVerifyButton = screen.queryByTestId("button-verify-brightid");

//       // Click verify button on brightid card
//       fireEvent.click(initialVerifyButton!);

//       // Wait to see the verify button on the modal
//       await waitFor(() => {
//         const verifyModalButton = screen.getByTestId("modal-verify-btn");
//         expect(verifyModalButton).toBeInTheDocument();
//       });

//       const finalVerifyButton = screen.queryByRole("button", {
//         name: /Verify/,
//       });

//       // Click the verify button on modal
//       fireEvent.click(finalVerifyButton!);

//       await waitFor(() => {
//         expect(mockHandleAddStamp).toBeCalled();
//       });

//       // Wait to see the done toast
//       await waitFor(() => {
//         const doneToast = screen.getByTestId("toast-done-brightid");
//         expect(doneToast).toBeInTheDocument();
//       });
//     });

//     it("clicking cancel closes the modal and a stamp should not be added", async () => {
//       (fetchVerifiableCredential as jest.Mock).mockResolvedValue(SUCCESFUL_BRIGHTID_RESULT);
//       renderWithContext(mockUserContext, mockCeramicContext, <BrightidCard />);

//       const initialVerifyButton = screen.queryByTestId("button-verify-brightid");

//       fireEvent.click(initialVerifyButton!);

//       // Wait to see the cancel button on the modal
//       let modalCancelButton: HTMLElement | null = null;
//       await waitFor(() => {
//         modalCancelButton = screen.queryByRole("button", {
//           name: /Cancel/,
//         });
//         expect(modalCancelButton).toBeInTheDocument();
//       });

//       fireEvent.click(modalCancelButton!);

//       expect(mockHandleAddStamp).not.toBeCalled();

//       await waitForElementToBeRemoved(modalCancelButton);
//       expect(modalCancelButton).not.toBeInTheDocument();
//     });
//   });

//   describe("and when a failed Bright Id result is returned", () => {
//     it("modal displays steps to get sponsored", async () => {
//       global.fetch = jest.fn().mockImplementation(setupFetchStub(false));
//       (fetchVerifiableCredential as jest.Mock).mockRejectedValue("ERROR");
//       renderWithContext(mockUserContext, mockCeramicContext, <BrightidCard />);

//       const initialVerifyButton = screen.queryByTestId("button-verify-brightid");

//       fireEvent.click(initialVerifyButton!);

//       const verifyModal = await screen.findByRole("dialog");
//       const triggerSponsorButton = screen.queryByTestId("button-sponsor-brightid");
//       const verifyModalText = screen.queryByTestId("brightid-modal-step1");

//       expect(verifyModal).toBeInTheDocument();
//       await waitFor(() => {
//         expect(verifyModalText).toBeInTheDocument();
//       });
//       expect(triggerSponsorButton).toBeInTheDocument();
//     });
//   });
// });
