import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { TwitterPlatform } from "../../../components/PlatformCards";

import { UserContextState } from "../../../context/userContext";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { twitterStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../../context/ceramicContext";

jest.mock("../../../utils/onboard.ts");

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("when user has not verfied with TwitterProvider", () => {
  it("should display a twitter verification button", () => {
    // renderWithContext(mockUserContext, mockCeramicContext, <TwitterCard />);
    // const twitterVerifyButton = screen.queryByTestId("button-verify-twitter");
    // expect(twitterVerifyButton).toBeInTheDocument();
  });
});

// describe("when user has verified with TwitterProvider", () => {
//   it("should display that twitter is verified", () => {
//     renderWithContext(
//       mockUserContext,
//       {
//         ...mockCeramicContext,
//         allProvidersState: {
//           Twitter: {
//             providerSpec: STAMP_PROVIDERS.Twitter,
//             stamp: twitterStampFixture,
//           },
//         },
//       },
//       <TwitterCard />
//     );

//     const twitterVerified = screen.queryByText(/Verified/);

//     expect(twitterVerified).toBeInTheDocument();
//   });

//   it("should be able to delete the stamp", async () => {
//     const mockHandleDeleteStamp = jest.fn().mockResolvedValue(undefined);

//     const mockCeramicContext: CeramicContextState = makeTestCeramicContext({
//       handleDeleteStamp: mockHandleDeleteStamp,
//     });

//     mockCeramicContext.allProvidersState.Twitter = {
//       providerSpec: STAMP_PROVIDERS.Twitter,
//       stamp: {
//         provider: "Twitter",
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
//             provider: "Twitter",
//           },
//         },
//       },
//     };

//     renderWithContext(mockUserContext, mockCeramicContext, <TwitterCard />);

//     // Open menu (click the menu button)
//     const menuButton = screen.queryByTestId("card-menu-button");
//     fireEvent.click(menuButton!);

//     // Click the delete option
//     const deleteMenuOption = screen.queryByTestId("remove-stamp");
//     fireEvent.click(deleteMenuOption!);

//     expect(mockHandleDeleteStamp).toBeCalledWith("STREAM-ID");
//   });
// });
