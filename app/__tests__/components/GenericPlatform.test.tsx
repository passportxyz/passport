import React from "react";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { GenericPlatform } from "../../components/GenericPlatform";

import { platforms } from "@gitcoin/passport-platforms";
const { Ens } = platforms;

import { CeramicContextState } from "../../context/ceramicContext";
import { UN_SUCCESSFUL_ENS_RESULT, SUCCESFUL_ENS_RESULTS } from "../../__test-fixtures__/verifiableCredentialResults";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";
import { JsonRpcSigner } from "@ethersproject/providers";
import { mock } from "jest-mock-extended";
import { ChakraProvider } from "@chakra-ui/react";
import { closeAllToasts } from "../../__test-fixtures__/toastTestHelpers";
import { PlatformScoreSpec } from "../../context/scorerContext";
import { PROVIDER_ID } from "@gitcoin/passport-types";

jest.mock("@didtools/cacao", () => ({
  Cacao: {
    fromBlockBytes: jest.fn(),
  },
}));

jest.mock("@gitcoin/passport-identity", () => ({
  fetchVerifiableCredential: jest.fn(),
}));

jest.mock("../../utils/helpers.tsx", () => {
  const originalModule = jest.requireActual("../../utils/helpers.tsx");
  return {
    ...originalModule,
    createSignedPayload: jest.fn(),
    generateUID: jest.fn(),
    getProviderSpec: jest.fn(),
  };
});

jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { filter: "" },
  }),
}));

const mockToggleConnection = jest.fn();
const mockCreatePassport = jest.fn();
const mockSigner = mock(JsonRpcSigner) as unknown as JsonRpcSigner;

const mockCeramicContext: CeramicContextState = makeTestCeramicContext({
  handleCreatePassport: mockCreatePassport,
});

const EnsScoreSpec: PlatformScoreSpec = {
  ...platforms["Ens"].PlatformDetails,
  possiblePoints: 3,
  earnedPoints: 1,
};

describe("when user has not verified with EnsProvider", () => {
  beforeEach(async () => {
    await closeAllToasts();
    (fetchVerifiableCredential as jest.Mock).mockResolvedValue({
      credentials: [SUCCESFUL_ENS_RESULTS],
    });
  });
  it("should display a verification button", () => {
    const drawer = () => (
      <GenericPlatform
        isOpen={true}
        platform={new Ens.EnsPlatform()}
        platFormGroupSpec={Ens.ProviderConfig}
        platformScoreSpec={EnsScoreSpec}
        onClose={() => {}}
      />
    );

    renderWithContext(mockCeramicContext, drawer());
    const initialVerifyButton = screen.queryByTestId("button-verify-Ens");
    expect(initialVerifyButton).toBeInTheDocument();
  });
  it("should attempt to fetch a verifiable credential when the button is clicked", async () => {
    const drawer = () => (
      <GenericPlatform
        isOpen={true}
        platform={new Ens.EnsPlatform()}
        platFormGroupSpec={Ens.ProviderConfig}
        platformScoreSpec={EnsScoreSpec}
        onClose={() => {}}
      />
    );
    renderWithContext(mockCeramicContext, drawer());

    const initialVerifyButton = screen.queryByTestId("button-verify-Ens");

    fireEvent.click(initialVerifyButton as HTMLElement);
    await waitFor(() => {
      expect(fetchVerifiableCredential).toHaveBeenCalled();
    });
  });

  it("should show success toast when credential is fetched", async () => {
    const drawer = () => (
      <ChakraProvider>
        <GenericPlatform
          platform={new Ens.EnsPlatform()}
          isOpen={true}
          platFormGroupSpec={Ens.ProviderConfig}
          platformScoreSpec={EnsScoreSpec}
          onClose={() => {}}
        />
      </ChakraProvider>
    );
    renderWithContext(mockCeramicContext, drawer());

    const initialVerifyButton = screen.queryByTestId("button-verify-Ens");

    fireEvent.click(initialVerifyButton as HTMLElement);
    // Wait to see the done toast
    await waitFor(() => {
      expect(screen.getByText("All Ens data points verified.")).toBeInTheDocument();
    });
  });

  it("should prompt user to refresh when session expired", async () => {
    const drawer = () => (
      <ChakraProvider>
        <GenericPlatform
          isOpen={true}
          platform={new Ens.EnsPlatform()}
          platFormGroupSpec={Ens.ProviderConfig}
          platformScoreSpec={EnsScoreSpec}
          onClose={() => {}}
        />
      </ChakraProvider>
    );
    renderWithContext(mockCeramicContext, drawer(), {
      checkSessionIsValid: () => false,
    });

    const initialVerifyButton = screen.queryByTestId("button-verify-Ens");

    fireEvent.click(initialVerifyButton as HTMLElement);
    // Wait to see the error toast
    await waitFor(() => {
      expect(screen.getByText("Please refresh the page to reset your session.")).toBeInTheDocument();
    });
  });
});

describe("when user has previously verified with EnsProvider", () => {
  beforeEach(async () => {
    await closeAllToasts();
    (fetchVerifiableCredential as jest.Mock).mockResolvedValue({
      credentials: [UN_SUCCESSFUL_ENS_RESULT],
    });
  });

  it("should show re-verified toast when credential is selected but no longer able to be re-claimed", async () => {
    const extraProvider = "FakeExtraProviderRequiredForCanSubmitLogic" as PROVIDER_ID;
    const drawer = () => (
      <ChakraProvider>
        <GenericPlatform
          isOpen={true}
          platform={new Ens.EnsPlatform()}
          platFormGroupSpec={[
            {
              ...Ens.ProviderConfig[0],
              providers: [...Ens.ProviderConfig[0].providers, { title: "Extra", name: extraProvider }],
            },
          ]}
          platformScoreSpec={EnsScoreSpec}
          onClose={() => {}}
        />
      </ChakraProvider>
    );

    const handlePatchStampsMock = jest.fn();
    renderWithContext(
      {
        ...mockCeramicContext,
        verifiedProviderIds: ["Ens"],
        handlePatchStamps: handlePatchStampsMock,
      },
      drawer()
    );
    const initialVerifyButton = screen.queryByTestId("button-verify-Ens");
    fireEvent.click(initialVerifyButton as HTMLElement);

    // Wait to see the done toast
    await waitFor(() => {
      // Empty b/c don't qualify for any stamps but also don't want to delete any stamps
      expect(handlePatchStampsMock).toHaveBeenCalledWith([]);

      expect(screen.getByText("Successfully re-verified Ens data point.")).toBeInTheDocument();
      expect(fetchVerifiableCredential).toHaveBeenCalled();
    });
  });
  it("should remove expired stamps if the no longer qualify", async () => {
    (fetchVerifiableCredential as jest.Mock).mockResolvedValue({
      credentials: [UN_SUCCESSFUL_ENS_RESULT],
    });
    const drawer = () => (
      <ChakraProvider>
        <GenericPlatform
          isOpen={true}
          platform={new Ens.EnsPlatform()}
          platFormGroupSpec={[
            {
              ...Ens.ProviderConfig[0],
              providers: [...Ens.ProviderConfig[0].providers],
            },
          ]}
          platformScoreSpec={EnsScoreSpec}
          onClose={() => {}}
        />
      </ChakraProvider>
    );

    const handlePatchStampsMock = jest.fn();
    renderWithContext(
      {
        ...mockCeramicContext,
        verifiedProviderIds: ["Ens"],
        expiredProviders: ["Ens"],
        handlePatchStamps: handlePatchStampsMock,
      },
      drawer()
    );
    const initialVerifyButton = screen.queryByTestId("button-verify-Ens");
    fireEvent.click(initialVerifyButton as HTMLElement);

    // Wait to see the done toast
    await waitFor(() => {
      // extraProvider should be empty but ens should be there to delete expired stamp you no longer qualify for
      expect(handlePatchStampsMock).toHaveBeenCalledWith([
        {
          provider: "Ens",
        },
      ]);

      expect(fetchVerifiableCredential).toHaveBeenCalled();
    });
  });
});

describe("Mulitple EVM plaftorms", () => {
  it("Should show no stamp modal if the platform isEVM and no stamps were found", async () => {
    (fetchVerifiableCredential as jest.Mock).mockResolvedValue({
      credentials: [UN_SUCCESSFUL_ENS_RESULT],
    });
    const drawer = () => (
      <GenericPlatform
        isOpen={true}
        platform={new Ens.EnsPlatform()}
        platFormGroupSpec={Ens.ProviderConfig}
        platformScoreSpec={EnsScoreSpec}
        onClose={() => {}}
      />
    );
    renderWithContext(mockCeramicContext, drawer());

    const initialVerifyButton = screen.queryByTestId("button-verify-Ens");

    fireEvent.click(initialVerifyButton as HTMLElement);
    await waitFor(async () => {
      const verifyModal = await screen.findByRole("dialog");
      expect(verifyModal).toBeInTheDocument();
    });
  });
});

it("should indicate that there was an error issuing the credential", async () => {
  const drawer = () => (
    <ChakraProvider>
      <GenericPlatform
        isOpen={true}
        platform={new Ens.EnsPlatform()}
        platFormGroupSpec={Ens.ProviderConfig}
        platformScoreSpec={EnsScoreSpec}
        onClose={() => {}}
      />
    </ChakraProvider>
  );
  renderWithContext({ ...mockCeramicContext, handlePatchStamps: jest.fn().mockRejectedValue(500) }, drawer());
  const initialVerifyButton = screen.queryByTestId("button-verify-Ens");

  fireEvent.click(initialVerifyButton as HTMLElement);
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
//         <GenericPlatform platform={new Ens.EnsPlatform()} platFormGroupSpec={Ens.ProviderConfig} />
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
//         <GenericPlatform platform={new Ens.EnsPlatform()} platFormGroupSpec={Ens.ProviderConfig} />
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
