import { JsonRpcSigner } from "@ethersproject/providers";
import { fireEvent, screen } from "@testing-library/react";
import { mock } from "jest-mock-extended";
import { STAMP_PROVIDERS } from "../../../config/providers";
import { CeramicContextState } from "../../../context/ceramicContext";
import { UserContextState } from "../../../context/userContext";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../../__test-fixtures__/contextTestHelpers";
import { worldIDStampFixture } from "../../../__test-fixtures__/databaseStorageFixtures";
import { mockAddress } from "../../../__test-fixtures__/onboardHookValues";

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

describe("when user has not verfied with WorldIDProvider", () => {
  it("should display a verify button", () => {
    // renderWithContext(mockUserContext, mockCeramicContext, <WorldIDCard />);
    // const initialVerifyButton = screen.queryByTestId("button-verify-world-id");
    // expect(initialVerifyButton).toBeInTheDocument();
  });
});

describe("when user has verified with WorldIDProvider", () => {
  it("should display that passport is World ID verified", () => {
    // renderWithContext(
    //   mockUserContext,
    //   {
    //     ...mockCeramicContext,
    //     allProvidersState: {
    //       WorldID: {
    //         providerSpec: STAMP_PROVIDERS.WorldID,
    //         stamp: worldIDStampFixture,
    //       },
    //     },
    //   },
    //   <WorldIDCard />
    // );
    // const isVerified = screen.queryByText(/Verified/);
    // expect(isVerified).toBeInTheDocument();
  });

  // it("should be able to delete the stamp", async () => {
  //   const mockHandleDeleteStamp = jest.fn().mockResolvedValue(undefined);

  //   const mockCeramicContext: CeramicContextState = makeTestCeramicContext({
  //     handleDeleteStamp: mockHandleDeleteStamp,
  //   });

  //   mockCeramicContext.allProvidersState.WorldID = {
  //     providerSpec: STAMP_PROVIDERS.WorldID,
  //     stamp: {
  //       provider: "WorldID",
  //       streamId: "STREAM-ID",
  //       credential: {
  //         type: ["VerifiableCredential"],
  //         proof: {
  //           jws: "this is the jws",
  //           type: "Ed25519Signature2018",
  //           created: "2022-07-01T11:02:03.186Z",
  //           proofPurpose: "assertionMethod",
  //           verificationMethod: "did:key:klsdhcu263789gd870237gd8ewg7823#,dsjnbjklhy923769-dhskjcjsdky8973",
  //         },
  //         issuer: "did:key:cdsmlkanfosiu892738921374923ure",
  //         "@context": ["https://www.w3.org/2018/credentials/v1"],
  //         issuanceDate: "2022-07-21T11:02:03.185Z",
  //         expirationDate: "2022-10-19T11:02:03.185Z",
  //         credentialSubject: {
  //           id: "did:pkh:eip155:1:0xojicsd86238hdsiy89q7e",
  //           hash: "v0.0.0:cdsdnkowu827380dsfhfoushfousd",
  //           "@context": [{ hash: "https://schema.org/Text", provider: "https://schema.org/Text" }],
  //           provider: "Twitter",
  //         },
  //       },
  //     },
  //   };

  //   renderWithContext(mockUserContext, mockCeramicContext, <WorldIDCard />);

  //   // Open menu (click the menu button)
  //   const menuButton = screen.queryByTestId("card-menu-button");
  //   fireEvent.click(menuButton!);

  //   // Click the delete option
  //   const deleteMenuOption = screen.queryByTestId("remove-stamp");
  //   fireEvent.click(deleteMenuOption!);

  //   expect(mockHandleDeleteStamp).toBeCalledWith("STREAM-ID");
  // });
});
