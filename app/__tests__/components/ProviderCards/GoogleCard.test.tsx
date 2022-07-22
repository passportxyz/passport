import React from "react";
import { screen, fireEvent } from "@testing-library/react";
import { GoogleCard } from "../../../components/ProviderCards";

import { UserContextState } from "../../../context/userContext";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { googleStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../../__test-fixtures__/contextTestHelpers";
import { CeramicContextState } from "../../../context/ceramicContext";

jest.mock("../../../utils/onboard.ts");

const mockUserContext: UserContextState = makeTestUserContext();
const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

describe("when user has not verified with GoogleProvider", () => {
  it("should display a google verification button", () => {
    renderWithContext(mockUserContext, mockCeramicContext, <GoogleCard />);

    const verifyGoogleButton = screen.queryByTestId("button-verify-google");

    expect(verifyGoogleButton).toBeInTheDocument();
  });
});

describe("when user has verified with GoogleProvider", () => {
  it("should display that google is verified", () => {
    renderWithContext(
      mockUserContext,
      {
        ...mockCeramicContext,
        allProvidersState: {
          Google: {
            providerSpec: STAMP_PROVIDERS.Google,
            stamp: googleStampFixture,
          },
        },
      },
      <GoogleCard />
    );

    const googleVerified = screen.queryByText(/Verified/);

    expect(googleVerified).toBeInTheDocument();
  });

  it("should be able to delete the stamp", async () => {
    const mockHandleDeleteStamp = jest.fn().mockResolvedValue(undefined);

    const mockCeramicContext: CeramicContextState = makeTestCeramicContext({
      handleDeleteStamp: mockHandleDeleteStamp,
    });

    mockCeramicContext.allProvidersState.Google = {
      providerSpec: STAMP_PROVIDERS.Google,
      stamp: {
        provider: "Google",
        credential: {
          type: ["VerifiableCredential"],
          proof: {
            jws: "this is the jws",
            type: "Ed25519Signature2018",
            created: "2022-07-01T11:02:03.186Z",
            proofPurpose: "assertionMethod",
            verificationMethod: "did:key:klsdhcu263789gd870237gd8ewg7823#,dsjnbjklhy923769-dhskjcjsdky8973",
          },
          issuer: "did:key:cdsmlkanfosiu892738921374923ure",
          "@context": ["https://www.w3.org/2018/credentials/v1"],
          issuanceDate: "2022-07-21T11:02:03.185Z",
          expirationDate: "2022-10-19T11:02:03.185Z",
          credentialSubject: {
            id: "did:pkh:eip155:1:0xojicsd86238hdsiy89q7e",
            hash: "v0.0.0:cdsdnkowu827380dsfhfoushfousd",
            "@context": [{ hash: "https://schema.org/Text", provider: "https://schema.org/Text" }],
            provider: "Google",
          },
        },
      },
      streamId: "STREAM-ID",
    };

    renderWithContext(mockUserContext, mockCeramicContext, <GoogleCard />);

    // Open menu (click the menu button)
    const menuButton = screen.queryByTestId("card-menu-button");
    fireEvent.click(menuButton!);

    // Click the delete option
    const deleteMenuOption = screen.queryByTestId("remove-stamp");
    fireEvent.click(deleteMenuOption!);

    expect(mockHandleDeleteStamp).toBeCalledWith("STREAM-ID");
  });
});
