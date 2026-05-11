/* eslint-disable */
// ---- Test subject
import {
  DigitalCollectorProvider,
  ArtAficionadoProvider,
  NftVisionaryProvider,
  NftCollectorBaseProvider,
} from "../collectors_journey.js";

import { RequestPayload } from "@gitcoin/passport-types";
import { ProviderBackendError, ProviderExternalVerificationError } from "../../../types.js";

// ----- Libs
import axios, { AxiosError } from "axios";
jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLocaleLowerCase();

describe("Valid stamp verification Collector's Journey", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should return valid stamp for DigitalCollector (50)", async () => {
    (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          data: {
            human_probability: 50,
          },
        },
      });
    });

    const digitalCollectorProvider = new DigitalCollectorProvider();
    const digitalCollectorPayload = await digitalCollectorProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(digitalCollectorPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });

  it("Should return valid stamp for DigitalCollector (60)", async () => {
    (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          data: {
            human_probability: 60,
          },
        },
      });
    });

    const digitalCollectorProvider = new DigitalCollectorProvider();
    const digitalCollectorPayload = await digitalCollectorProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(digitalCollectorPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });

  it("Should return valid stamp for ArtAficionado (75)", async () => {
    (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          data: {
            human_probability: 75,
          },
        },
      });
    });

    const artAficionadoProvider = new ArtAficionadoProvider();
    const artAficionadoPayload = await artAficionadoProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(artAficionadoPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });

  it("Should return valid stamp for ArtAficionado (80)", async () => {
    (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          data: {
            human_probability: 80,
          },
        },
      });
    });

    const artAficionadoProvider = new ArtAficionadoProvider();
    const artAficionadoPayload = await artAficionadoProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(artAficionadoPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });

  it("Should return valid stamp for NftVisionary (90)", async () => {
    (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          data: {
            human_probability: 90,
          },
        },
      });
    });

    const nftVisionaryProvider = new NftVisionaryProvider();
    const nftVisionaryPayload = await nftVisionaryProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(nftVisionaryPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });

  it("Should return valid stamp for NftVisionary (100)", async () => {
    (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          data: {
            human_probability: 100,
          },
        },
      });
    });

    const nftVisionaryProvider = new NftVisionaryProvider();
    const nftVisionaryPayload = await nftVisionaryProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(nftVisionaryPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
      },
    });
  });
});

describe("Invalid stamp verification Collector's Journey", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should return invalid stamp for DigitalCollector (45)", async () => {
    (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          data: {
            human_probability: 45,
          },
        },
      });
    });

    const digitalCollectorProvider = new DigitalCollectorProvider();
    const digitalCollectorPayload = await digitalCollectorProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(digitalCollectorPayload).toEqual({
      valid: false,
      errors: ["Your internal NFTScore is  45. You need a minimum of 50 to claim this stamp"],
    });
  });

  it("Should return invalid stamp for ArtAficionado (65)", async () => {
    (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          data: {
            human_probability: 65,
          },
        },
      });
    });

    const artAficionadoProvider = new ArtAficionadoProvider();
    const artAficionadoPayload = await artAficionadoProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(artAficionadoPayload).toEqual({
      valid: false,
      errors: ["Your internal NFTScore is  65. You need a minimum of 75 to claim this stamp"],
    });
  });

  it("Should return invalid stamp for NftVisionary (85)", async () => {
    (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          data: {
            human_probability: 85,
          },
        },
      });
    });

    const nftVisionaryProvider = new NftVisionaryProvider();
    const nftVisionaryPayload = await nftVisionaryProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(nftVisionaryPayload).toEqual({
      valid: false,
      errors: ["Your internal NFTScore is  85. You need a minimum of 90 to claim this stamp"],
    });
  });

  it("Should return invalid stamp for NftVisionary (undefined)", async () => {
    (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          data: {},
        },
      });
    });

    const nftVisionaryProvider = new NftVisionaryProvider();
    const nftVisionaryPayload = await nftVisionaryProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(nftVisionaryPayload).toEqual({
      valid: false,
      errors: ["Your internal NFTScore is  undefined. You need a minimum of 90 to claim this stamp"],
    });
  });
});

describe("Test Error cases for stamp  verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const buildAxiosError = (response: AxiosError["response"] | undefined, message = "Network error"): AxiosError => {
    const err = new Error(message) as AxiosError;
    if (response) err.response = response;
    return err;
  };

  it.each([
    ["DigitalCollectorProvider", new DigitalCollectorProvider()],
    ["ArtAficionadoProvider", new ArtAficionadoProvider()],
    ["NftVisionaryProvider", new NftVisionaryProvider()],
  ])(
    "%p should throw ProviderBackendError on 5xx response from nft stamp api",
    async (_nftProviderName: string, nftProvider: NftCollectorBaseProvider) => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      const mockAxiosError = buildAxiosError({
        status: 500,
        data: {},
        headers: {},
        statusText: "Internal Server Error",
        config: { headers: {} as unknown as any },
      });

      mockedAxios.post.mockRejectedValueOnce(mockAxiosError);

      const verifyPromise = nftProvider.verify({
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload);

      await expect(verifyPromise).rejects.toThrow(ProviderBackendError);
      await expect(verifyPromise).rejects.toThrow(
        "Error making queryNftStampApi request, received error response with code 500: {}, headers: {}"
      );
    }
  );

  it.each([
    ["DigitalCollectorProvider", new DigitalCollectorProvider()],
    ["ArtAficionadoProvider", new ArtAficionadoProvider()],
    ["NftVisionaryProvider", new NftVisionaryProvider()],
  ])(
    "%p should throw ProviderBackendError when no response is received from nft stamp api",
    async (_nftProviderName: string, nftProvider: NftCollectorBaseProvider) => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      const mockAxiosError = buildAxiosError(undefined, "timeout of 10000ms exceeded");
      // axios sets `request` (but not `response`) when no response was received
      (mockAxiosError as any).request = {};

      mockedAxios.post.mockRejectedValueOnce(mockAxiosError);

      await expect(
        nftProvider.verify({
          address: MOCK_ADDRESS_LOWER,
        } as unknown as RequestPayload)
      ).rejects.toThrow(ProviderBackendError);
    }
  );

  it.each([
    ["DigitalCollectorProvider", new DigitalCollectorProvider()],
    ["ArtAficionadoProvider", new ArtAficionadoProvider()],
    ["NftVisionaryProvider", new NftVisionaryProvider()],
  ])(
    "%p should throw ProviderExternalVerificationError on 4xx response from nft stamp api",
    async (_nftProviderName: string, nftProvider: NftCollectorBaseProvider) => {
      mockedAxios.isAxiosError.mockReturnValue(true);
      const mockAxiosError = buildAxiosError({
        status: 400,
        data: { detail: "bad address" },
        headers: {},
        statusText: "Bad Request",
        config: { headers: {} as unknown as any },
      });

      mockedAxios.post.mockRejectedValueOnce(mockAxiosError);

      const verifyPromise = nftProvider.verify({
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload);

      await expect(verifyPromise).rejects.toThrow(ProviderExternalVerificationError);
      await expect(verifyPromise).rejects.not.toThrow(ProviderBackendError);
    }
  );
});
