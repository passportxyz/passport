// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { BiometricsProvider } from "../Providers/Biometrics.js";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0xb4b6f1c68be31841b52f4015a31d1f38b99cdb71";

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true when valid response is received from the Holonym Biometrics API endpoint", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        result: true,
      },
    });

    const biometrics = new BiometricsProvider();
    const verifiedPayload = await biometrics.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.valid).toBe(true);
    expect(verifiedPayload.record).toEqual({
      address: MOCK_ADDRESS.toLowerCase(),
    });
  });

  it("should return false when invalid response is received from the Holonym Biometrics API endpoint", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        result: false,
      },
    });

    const biometrics = new BiometricsProvider();
    const verifiedPayload = await biometrics.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(verifiedPayload.valid).toBe(false);
    expect(verifiedPayload).toEqual({
      valid: false,
      errors: ["We were unable to verify that your address has completed biometric verification -- isUnique: false."],
      record: undefined,
    });
  });

  it("should return error response when API call errors", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("Internal Server Error"));
    const UNREGISTERED_ADDRESS = "0xunregistered";

    const biometrics = new BiometricsProvider();

    await expect(
      biometrics.verify({
        address: UNREGISTERED_ADDRESS,
      } as RequestPayload)
    ).rejects.toThrow("Internal Server Error");
  });

  it("should call the correct API endpoint with the user address", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        result: true,
      },
    });

    const biometrics = new BiometricsProvider();
    await biometrics.verify({
      address: MOCK_ADDRESS,
    } as RequestPayload);

    expect(mockedAxios.get).toHaveBeenCalledWith(
      `https://api.holonym.io/sybil-resistance/biometrics/optimism?user=${MOCK_ADDRESS.toLowerCase()}&action-id=123456789`
    );
  });
});
