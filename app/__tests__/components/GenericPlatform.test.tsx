import React from "react";
import { fireEvent, render, screen, waitFor, waitForElementToBeRemoved } from "@testing-library/react";
import { GenericPlatform } from "../../components/GenericPlatform";

import { Ens } from "@gitcoin/passport-platforms";

import { UserContextState } from "../../context/userContext";
import { CeramicContextState } from "../../context/ceramicContext";
import { mockAddress } from "../../__test-fixtures__/onboardHookValues";
import { ensStampFixture } from "../../__test-fixtures__/databaseStorageFixtures";
import { UN_SUCCESSFUL_ENS_RESULT, SUCCESFUL_ENS_RESULTS } from "../../__test-fixtures__/verifiableCredentialResults";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";
import {
  makeTestCeramicContext,
  makeTestUserContext,
  renderWithContext,
} from "../../__test-fixtures__/contextTestHelpers";
import { JsonRpcSigner } from "@ethersproject/providers";
import { mock } from "jest-mock-extended";
import { Drawer, DrawerOverlay } from "@chakra-ui/react";

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

jest.mock("@gitcoin/passport-identity/dist/commonjs/src/credentials", () => ({
  fetchVerifiableCredential: jest.fn(),
}));
jest.mock("../../utils/onboard.ts");
const handleFetchCredential = jest.fn();

jest.mock("../../utils/helpers.tsx", () => ({
  generateUID: jest.fn(),
  difference: (setA: any, setB: any) => ({
    size: 1,
  }),
}));

jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { filter: "" },
  }),
}));

const mockToggleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const mockHandleAddStamp = jest.fn().mockResolvedValue(undefined);
const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;
const mockUserContext: UserContextState = makeTestUserContext({
  toggleConnection: mockToggleConnection,
  address: mockAddress,
  signer: mockSigner,
});

const mockCeramicContext: CeramicContextState = makeTestCeramicContext({
  handleCreatePassport: mockCreatePassport,
});

// TODO

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
        <GenericPlatform platform={new Ens.EnsPlatform()} platFormGroupSpec={Ens.EnsProviderConfig} />
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
        <GenericPlatform platform={new Ens.EnsPlatform()} platFormGroupSpec={Ens.EnsProviderConfig} />
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
        <GenericPlatform platform={new Ens.EnsPlatform()} platFormGroupSpec={Ens.EnsProviderConfig} />
      </Drawer>
    );
    renderWithContext(mockUserContext, mockCeramicContext, drawer());

    const firstSwitch = screen.queryByTestId("select-all");
    await fireEvent.click(firstSwitch as HTMLElement);
    const initialVerifyButton = screen.queryByTestId("button-verify-Ens");

    await fireEvent.click(initialVerifyButton as HTMLElement);
    // Wait to see the done toast
    await waitFor(() => {
      expect(screen.getByText("All Ens data points verified.")).toBeInTheDocument();
    });
  });
});

describe("Mulitple EVM plaftorms", () => {
  it("Should show no stamp modal if the platform isEVM and no stamps were found", async () => {
    (fetchVerifiableCredential as jest.Mock).mockResolvedValue({
      credentials: [UN_SUCCESSFUL_ENS_RESULT],
    });
    const drawer = () => (
      <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
        <DrawerOverlay />
        <GenericPlatform platform={new Ens.EnsPlatform()} platFormGroupSpec={Ens.EnsProviderConfig} />
      </Drawer>
    );
    renderWithContext(mockUserContext, mockCeramicContext, drawer());

    const firstSwitch = screen.queryByTestId("select-all");
    await fireEvent.click(firstSwitch as HTMLElement);
    const initialVerifyButton = screen.queryByTestId("button-verify-Ens");

    await fireEvent.click(initialVerifyButton as HTMLElement);
    await waitFor(async () => {
      const verifyModal = await screen.findByRole("dialog");
      expect(verifyModal).toBeInTheDocument();
    });
  });
});

it("should indicate that there was an error issuing the credential", async () => {
  const drawer = () => (
    <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
      <DrawerOverlay />
      <GenericPlatform platform={new Ens.EnsPlatform()} platFormGroupSpec={Ens.EnsProviderConfig} />
    </Drawer>
  );
  renderWithContext(
    mockUserContext,
    { ...mockCeramicContext, handleAddStamps: jest.fn().mockRejectedValue(500) },
    drawer()
  );

  const firstSwitch = screen.queryByTestId("select-all");
  await fireEvent.click(firstSwitch as HTMLElement);
  const initialVerifyButton = screen.queryByTestId("button-verify-Ens");

  await fireEvent.click(initialVerifyButton as HTMLElement);
  await waitFor(() => {
    expect(screen.getByText("There was an error verifying your stamp. Please try again.")).toBeInTheDocument();
  });
});

// describe("when user attempts to re-verify their passport data point(s)", () => {
//   beforeEach(() => {
//     (fetchVerifiableCredential as jest.Mock).mockResolvedValue({
//       credentials: [SUCCESFUL_ENS_RESULTS],
//     });
//   });

//   it("should show 'Success!' done toast message if user still qualifies for data point", async () => {
//     const drawer = () => (
//       <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
//         <DrawerOverlay />
//         <GenericPlatform platform={new Ens.EnsPlatform()} platFormGroupSpec={Ens.EnsProviderConfig} />
//       </Drawer>
//     );

//     renderWithContext(mockUserContext, mockCeramicContext, drawer());

//     screen.queryByTestId("select-all");
//     screen.getByText("Verify").focus();
//     fireEvent.keyDown(document.activeElement || document.body);
//     // Add mock handleFetchCredential function (???)

//     // Wait to see the done toast
//     await waitFor(() => {
//       expect(screen.getByText("Success!"));
//     });

// const secondSwitch = screen.queryByTestId("switch-0");
// await fireEvent.click(secondSwitch as HTMLElement);
// await fireEvent.click(secondSwitch as HTMLElement);

// const saveButton = screen.queryByTestId("button-verify-Ens");

// await fireEvent.click(saveButton as HTMLElement);
// // Wait to see the done toast
// await waitFor(() => {
//   expect(screen.getByTestId("toast-done-ens")).toBeInTheDocument();
// }, {timeout: 3000});
// });

// it("should show 'Verification Failure' done toast message if user no longer qualifies for data point", async () => {

// });
// });

// describe("when user does not successfully verify an EnsProvider", () => {
//   beforeEach(() => {
//     (fetchVerifiableCredential as jest.Mock).mockResolvedValue({
//       credentials: [],
//     });
//   });
//   it("should show error toast when credential is not fetched", async () => {
//     const drawer = () => (
//       <Drawer isOpen={true} placement="right" size="sm" onClose={() => {}}>
//         <DrawerOverlay />
//         <GenericPlatform platform={new Ens.EnsPlatform()} platFormGroupSpec={Ens.EnsProviderConfig} />
//       </Drawer>
//     );
//     renderWithContext(mockUserContext, mockCeramicContext, drawer());

//     const firstSwitch = screen.queryByTestId("select-all");
//     await fireEvent.click(firstSwitch as HTMLElement);
//     const initialVerifyButton = screen.queryByTestId("button-verify-Ens");

//     await fireEvent.click(initialVerifyButton as HTMLElement);
//     // Wait to see the done toast
//     await waitFor(() => {
//       expect(screen.getByText("Verification Failed")).toBeInTheDocument();
//     });
//   });
// });
