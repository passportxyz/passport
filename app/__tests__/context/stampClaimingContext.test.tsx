import { vi, describe, it, expect } from "vitest";
import { render, waitFor, screen, fireEvent } from "@testing-library/react";
import { useContext } from "react";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";

import { CeramicContext } from "../../context/ceramicContext";
import { StampClaimingContext, StampClaimingContextProvider } from "../../context/stampClaimingContext";
import { fetchVerifiableCredential } from "../../utils/credentials";

import { PLATFORM_ID, ValidResponseBody } from "@gitcoin/passport-types";
import { PlatformProps } from "../../components/GenericPlatform";
import { AppContext, PlatformClass } from "@gitcoin/passport-platforms";
import { DatastoreConnectionContext, DbAuthTokenStatus } from "../../context/datastoreConnectionContext";

vi.mock("../../utils/helpers", () => ({
  generateUID: vi.fn((length: number) => "some random string"),
}));

vi.mock("../../utils/credentials", () => ({
  fetchVerifiableCredential: vi.fn(),
}));

vi.mock("../../config/platformMap", async (importActual) => {
  const originalModule = (await importActual()) as any;
  let newPlatforms = new Map<PLATFORM_ID, PlatformProps>();

  originalModule.defaultPlatformMap.forEach((value: PlatformProps, key: PLATFORM_ID) => {
    let platform: PlatformClass = {
      ...value.platform,
      getProviderPayload: vi.fn(async (appContext: AppContext) => {
        return {};
      }),
      getOAuthUrl: vi.fn(async (state, providers) => {
        return "";
      }),
    };
    let newValue: PlatformProps = { ...value };

    platform.getProviderPayload = vi.fn(async (appContext: AppContext) => {
      return {};
    });

    newValue.platform = platform;
    newPlatforms.set(key, newValue);
  });

  return {
    __esModule: true,
    ...originalModule,
    defaultPlatformMap: newPlatforms,
  };
});

const handleClaimStep = vi.fn();
const indicateError = vi.fn();

const TestingComponent = () => {
  const { claimCredentials } = useContext(StampClaimingContext);

  return (
    <div>
      <button
        data-testid="claim-button"
        onClick={() => {
          claimCredentials(handleClaimStep, indicateError, [
            {
              platformId: "Google",
              selectedProviders: ["Google"],
            },
            {
              platformId: "Gitcoin",
              selectedProviders: ["GitcoinContributorStatistics#totalContributionAmountGte#10"],
            },
          ]);
        }}
      >
        Claim
      </button>
    </div>
  );
};

const TestingComponentWithEvmStamp = () => {
  const { claimCredentials } = useContext(StampClaimingContext);

  return (
    <div>
      <button
        data-testid="claim-button"
        onClick={() => {
          claimCredentials(handleClaimStep, indicateError, [
            {
              platformId: "Google",
              selectedProviders: ["Google"],
            },
            {
              platformId: "Gitcoin",
              selectedProviders: ["GitcoinContributorStatistics#totalContributionAmountGte#10"],
            },
            {
              platformId: "EVMBulkVerify",
              selectedProviders: ["ethPossessionsGte#32"],
            },
          ]);
        }}
      >
        Claim
      </button>
    </div>
  );
};

const mockCeramicContext = makeTestCeramicContext({
  passport: {
    issuanceDate: new Date(),
    expiryDate: new Date(),
    stamps: [],
  },
});

const testCeramicContext = makeTestCeramicContext();

describe("<StampClaimingContext>", () => {
  const renderTestComponent = () =>
    renderWithContext(
      testCeramicContext,
      <DatastoreConnectionContext.Provider
        value={{
          connect: vi.fn(),
          disconnect: vi.fn(),
          dbAccessToken: "token",
          dbAccessTokenStatus: "idle" as DbAuthTokenStatus,
          did: vi.fn() as any,
        }}
      >
        <CeramicContext.Provider value={mockCeramicContext}>
          <StampClaimingContextProvider>
            <TestingComponent />
          </StampClaimingContextProvider>
        </CeramicContext.Provider>
      </DatastoreConnectionContext.Provider>
    );

  const renderTestComponentWithEvmStamp = () =>
    renderWithContext(
      testCeramicContext,
      <DatastoreConnectionContext.Provider
        value={{
          connect: vi.fn(),
          disconnect: vi.fn(),
          dbAccessToken: "token",
          dbAccessTokenStatus: "idle" as DbAuthTokenStatus,
          did: vi.fn() as any,
        }}
      >
        <CeramicContext.Provider value={mockCeramicContext}>
          <StampClaimingContextProvider>
            <TestingComponentWithEvmStamp />
          </StampClaimingContextProvider>
        </CeramicContext.Provider>
      </DatastoreConnectionContext.Provider>
    );

  beforeEach(() => {
    vi.mocked(fetchVerifiableCredential).mockImplementation(() => {
      return { credentials: [] } as any;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch all credentials specified when calling claimCredentials (non-EVM only)", async () => {
    renderTestComponent();

    // Click the claim button, which should call the `claimCredentials` function in the context
    await waitFor(async () => {
      const claimButton = screen.getByTestId("claim-button");
      fireEvent.click(claimButton);
    });

    // Verify that the `fetchVerifiableCredential` function has been called
    // Expect 1 call for each platform in the array
    expect(fetchVerifiableCredential).toHaveBeenCalledTimes(2);

    // Verify that the `handlePatchStamps` function has been called for the ceramic context
    expect(mockCeramicContext.handlePatchStamps).toHaveBeenCalledTimes(2);
    expect(indicateError).toHaveBeenCalled();
  });

  it("should not indicate error if verification was successful", async () => {
    vi.mocked(fetchVerifiableCredential).mockImplementation(() => {
      return {
        credentials: [
          {
            record: {
              type: "Google",
            },
          } as ValidResponseBody,
        ],
      };
    });

    renderTestComponent();

    // Click the claim button, which should call the `claimCredentials` function in the context
    await waitFor(async () => {
      const claimButton = screen.getByTestId("claim-button");
      fireEvent.click(claimButton);
    });

    expect(indicateError).not.toHaveBeenCalled();
  });

  it("should fetch all credentials specified when calling claimCredentials (evm credentials included)", async () => {
    renderTestComponentWithEvmStamp();

    // Click the claim button, which should call the `claimCredentials` function in the context
    await waitFor(async () => {
      const claimButton = screen.getByTestId("claim-button");
      fireEvent.click(claimButton);
    });

    // Verify that the `fetchVerifiableCredential` function has been called
    // Expect 1 call for each platform in the array
    expect(fetchVerifiableCredential).toHaveBeenCalledTimes(3);

    // Verify that the `handlePatchStamps` function has been called for the ceramic context
    expect(mockCeramicContext.handlePatchStamps).toHaveBeenCalledTimes(3);
  });
});
