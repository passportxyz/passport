/* eslint-disable */
// ---- Test subject
import { DigitalCollectorProvider, ArtAficionadoProvider, NFTVisionaryProvider } from "../collectors_journey";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios, { AxiosError } from "axios";
import { ProviderExternalVerificationError } from "../../../types";

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
        human_probability: "50",
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
        human_probability: "60",
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
        human_probability: "75",
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
        human_probability: "80",
      },
    });
  });

  it("Should return valid stamp for NFTVisionary (90)", async () => {
    (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          data: {
            human_probability: 90,
          },
        },
      });
    });

    const nftVisionaryProvider = new NFTVisionaryProvider();
    const nftVisionaryPayload = await nftVisionaryProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(nftVisionaryPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        human_probability: "90",
      },
    });
  });

  it("Should return valid stamp for NFTVisionary (100)", async () => {
    (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          data: {
            human_probability: 100,
          },
        },
      });
    });

    const nftVisionaryProvider = new NFTVisionaryProvider();
    const nftVisionaryPayload = await nftVisionaryProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(nftVisionaryPayload).toEqual({
      valid: true,
      record: {
        address: MOCK_ADDRESS_LOWER,
        human_probability: "100",
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

  it("Should return invalid stamp for NFTVisionary (85)", async () => {
    (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          data: {
            human_probability: 85,
          },
        },
      });
    });

    const nftVisionaryProvider = new NFTVisionaryProvider();
    const nftVisionaryPayload = await nftVisionaryProvider.verify({
      address: MOCK_ADDRESS_LOWER,
    } as unknown as RequestPayload);

    expect(nftVisionaryPayload).toEqual({
      valid: false,
      errors: ["Your internal NFTScore is  85. You need a minimum of 90 to claim this stamp"],
    });
  });

  it("Should return invalid stamp for NFTVisionary (undefined)", async () => {
    (axios.post as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        data: {
          data: {},
        },
      });
    });

    const nftVisionaryProvider = new NFTVisionaryProvider();
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

  it("should throw Provider External Verification error when unable to access nft stamp api", async () => {
    const mockAxiosError = new Error("Network error") as AxiosError;
    mockedAxios.isAxiosError.mockReturnValueOnce(true);
    mockAxiosError.response = {
      status: 500,
      data: {},
      headers: {},
      statusText: "Internal Server Error",
      config: {},
    };

    mockedAxios.post.mockRejectedValueOnce(mockAxiosError);

    const digitalCollectorProvider = new DigitalCollectorProvider();

    await expect(
      digitalCollectorProvider.verify({
        address: MOCK_ADDRESS_LOWER,
      } as unknown as RequestPayload)
    ).rejects.toThrow("Error making queryNftStampApi request, received error response with code 500: {}, headers: {}");
  });
});
