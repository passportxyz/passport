import React from "react";
import { fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { GenericEVMPlatform } from "../../components/GenericEVMPlatform";

import { Ens } from "@gitcoin/passport-platforms";

import { UserContextState } from "../../context/userContext";
import { CeramicContextState } from "../../context/ceramicContext";
import { mockAddress } from "../../__test-fixtures__/onboardHookValues";
import { ensStampFixture } from "../../__test-fixtures__/databaseStorageFixtures";
import { SUCCESFUL_ENS_RESULT, SUCCESFUL_ENS_RESULTS } from "../../__test-fixtures__/verifiableCredentialResults";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";
import { JsonRpcSigner } from "@ethersproject/providers";
import { mock } from "jest-mock-extended";
import { Drawer, DrawerOverlay } from "@chakra-ui/react";

jest.mock("@gitcoin/passport-identity/dist/commonjs/src/credentials", () => ({
  fetchVerifiableCredential: jest.fn(),
}));
jest.mock("../../utils/onboard.ts");

const mockHandleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const mockHandleAddStamp = jest.fn().mockResolvedValue(undefined);
const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;
const mockUserContext: UserContextState = makeTestUserContext({
  handleConnection: mockHandleConnection,
  address: mockAddress,
  signer: mockSigner,
});

const handleFetchCredential = jest.fn();

const mockCeramicContext: CeramicContextState = makeTestCeramicContext({
  handleCreatePassport: mockCreatePassport,
  handleAddStamp: mockHandleAddStamp,
});

describe("when user has not verified with EnsProvider", () => {
  beforeEach(() => {
    (fetchVerifiableCredential as jest.Mock).mockResolvedValue({
      credentials: [SUCCESFUL_ENS_RESULTS],
    });
  });
  it("should display a verification button", () => {
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <GenericEVMPlatform platformId={"Ens"} platFormGroupSpec={Ens.EnsProviderConfig} />
      </Drawer>
    );

    renderWithContext(mockUserContext, mockCeramicContext, drawer());
    const initialVerifyButton = screen.queryByTestId("button-verify-Ens");
    expect(initialVerifyButton).toBeInTheDocument();
  });
  it("should attempt to fetch a verifiable credential when the button is clicked", async () => {
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <GenericEVMPlatform platformId={"Ens"} platFormGroupSpec={Ens.EnsProviderConfig} />
      </Drawer>
    );
    renderWithContext(mockUserContext, mockCeramicContext, drawer());

    const firstSwitch = screen.queryByTestId("select-all");
    await fireEvent.click(firstSwitch as HTMLElement);
    const initialVerifyButton = screen.queryByTestId("button-verify-Ens");

    await fireEvent.click(initialVerifyButton as HTMLElement);
    await waitFor(() => {
      expect(fetchVerifiableCredential).toHaveBeenCalled();
    });
  });
  it("should show success toast when credential is fetched", async () => {
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <GenericEVMPlatform platformId={"Ens"} platFormGroupSpec={Ens.EnsProviderConfig} />
      </Drawer>
    );
    renderWithContext(mockUserContext, mockCeramicContext, drawer());

    const firstSwitch = screen.queryByTestId("select-all");
    await fireEvent.click(firstSwitch as HTMLElement);
    const initialVerifyButton = screen.queryByTestId("button-verify-Ens");

    await fireEvent.click(initialVerifyButton as HTMLElement);
    // Wait to see the done toast
    await waitFor(() => {
      expect(screen.getByText("Success!")).toBeInTheDocument();
    });
  });
});

describe("when user does not successfully verify an EnsProvider", () => {
  beforeEach(() => {
    (fetchVerifiableCredential as jest.Mock).mockResolvedValue({
      credentials: [],
    });
  });
  it("should show error toast when credential is not fetched", async () => {
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <GenericEVMPlatform platformId={"Ens"} platFormGroupSpec={Ens.EnsProviderConfig} />
      </Drawer>
    );
    renderWithContext(mockUserContext, mockCeramicContext, drawer());

    const firstSwitch = screen.queryByTestId("select-all");
    await fireEvent.click(firstSwitch as HTMLElement);
    const initialVerifyButton = screen.queryByTestId("button-verify-Ens");

    await fireEvent.click(initialVerifyButton as HTMLElement);
    // Wait to see the done toast
    await waitFor(() => {
      expect(screen.getByText("Verification Failed")).toBeInTheDocument();
    });
  });
});
