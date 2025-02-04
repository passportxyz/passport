/* eslint-disable */
// ---- Test subject
import { verifyCoinbaseAttestation } from "../Providers/coinbase.js";
import { CoinbasePlatform } from "../App-Bindings.js";
import { PlatformPreCheckError } from "../../utils/platform.js";

jest.mock("../Providers/coinbase");

const mockedVerifyCoinbaseAttestation = jest.mocked(verifyCoinbaseAttestation);

const mockResponse = {
  code: 123,
  sessionKey: "sessionKey",
  signature: "signature",
};

const appContext = {
  waitForRedirect: () => Promise.resolve(mockResponse),
  window: {
    open: jest.fn(),
  },
  screen: {
    width: 800,
    height: 600,
  },
  state: "state",
  userDid: "did:pk:ethr:1:0x12345",
  selectedProviders: [] as any[],
};

describe("getProviderInfo", () => {
  it("should return oauth info for a valid attestation", async () => {
    mockedVerifyCoinbaseAttestation.mockResolvedValueOnce(true);
    const providerInfo = await new CoinbasePlatform({
      clientId: "clientId",
      redirectUri: "redirectUri",
    }).getProviderPayload(appContext);
    expect(providerInfo.code).toBe(mockResponse.code);
    expect(mockedVerifyCoinbaseAttestation).toHaveBeenCalledWith("0x12345");
  });

  it("should return PlatformPreCheckError for an invalid attestation", async () => {
    mockedVerifyCoinbaseAttestation.mockResolvedValueOnce(false);
    await expect(
      new CoinbasePlatform({
        clientId: "clientId",
        redirectUri: "redirectUri",
      }).getProviderPayload(appContext)
    ).rejects.toThrowError(
      new PlatformPreCheckError(
        "You need to verify your Coinbase ID onchain before you can verify your Coinbase account."
      )
    );
    expect(mockedVerifyCoinbaseAttestation).toHaveBeenCalledWith("0x12345");
  });
});
