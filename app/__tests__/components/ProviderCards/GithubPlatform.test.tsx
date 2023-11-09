import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { GithubPlatform } from "../../../components/PlatformCards";

import { githubStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import {
  makeTestCeramicContext,
  renderWithContext,
  getProviderSpec,
} from "../../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../../context/ceramicContext";

const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("when user has not verified with GithubPlatform", () => {
  it("should display a github verification button", () => {
    // renderWithContext(mockUserContext, mockCeramicContext, <GithubPlatform />);
    // const githubVerifyButton = screen.queryByTestId("button-verify-github");
    // expect(githubVerifyButton).toBeInTheDocument();
  });
});

// describe("when user has verified with GithubProvider", () => {
//   it("should display that github is verified", () => {
//     renderWithContext(
//       mockUserContext,
//       {
//         ...mockCeramicContext,
//         allProvidersState: {
//           Github: {
//             providerSpec: getProviderSpec("Github", "Github"),
//             stamp: undefined,
//           },
//           TenOrMoreGithubFollowers: {
//             providerSpec: getProviderSpec("Github", "TenOrMoreGithubFollowers"),
//             stamp: undefined,
//           },
//           FiftyOrMoreGithubFollowers: {
//             providerSpec: getProviderSpec("Github", "FiftyOrMoreGithubFollowers"),
//             stamp: undefined,
//           },
//           ForkedGithubRepoProvider: {
//             providerSpec: getProviderSpec("Github", "ForkedGithubRepoProvider"),
//             stamp: undefined,
//           },
//           StarredGithubRepoProvider: {
//             providerSpec: getProviderSpec("Github", "StarredGithubRepoProvider"),
//             stamp: undefined,
//           },
//           FiveOrMoreGithubRepos: {
//             providerSpec: getProviderSpec("Github", "FiveOrMoreGithubRepos"),
//             stamp: undefined,
//           },
//         },
//       },
//       <GithubPlatform />
//     );

//     const githubVerified = screen.queryByText(/Verified/);

//     expect(githubVerified).toBeInTheDocument();
//   });
//   it("should be able to delete the stamp", async () => {
//     const mockHandleDeleteStamp = jest.fn().mockResolvedValue(undefined);

//     const mockCeramicContext: CeramicContextState = makeTestCeramicContext({
//       handleDeleteStamp: mockHandleDeleteStamp,
//     });

//     mockCeramicContext.allProvidersState.Github = {
//       providerSpec: getProviderSpec("Github", "Github"),
//       stamp: {
//         provider: "Github",
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
//             provider: "Github",
//           },
//         },
//       },
//     };

//     renderWithContext(mockUserContext, mockCeramicContext, <GithubPlatform />);

//     // Open menu (click the menu button)
//     const menuButton = screen.queryByTestId("card-menu-button");
//     fireEvent.click(menuButton!);

//     // Click the delete option
//     const deleteMenuOption = screen.queryByTestId("remove-stamp");
//     fireEvent.click(deleteMenuOption!);

//     expect(mockHandleDeleteStamp).toBeCalledWith("STREAM-ID");
//   });
// });
