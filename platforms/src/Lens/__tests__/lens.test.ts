// ---- Test subject
import { RequestPayload } from "@gitcoin/passport-types";
import { LensProfileProvider } from "../Providers/lens";
import axios from "axios";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const MOCK_ADDRESS = "0x738488886dd94725864ae38252a90be1ab7609c7";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLowerCase();
const MOCK_FAKE_ADDRESS = "fake_address";

const MOCK_HANDLE = "testHandle";

describe("Attempt verification", function () {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return true for an address with a lens handle", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        data: {
          defaultProfile: {
            id: MOCK_ADDRESS,
            handle: MOCK_HANDLE,
          },
        },
      },
    });

    const lens = new LensProfileProvider();
    const verifiedPayload = await lens.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        handle: MOCK_HANDLE,
      },
    });
  });

  it("should return false for an address without a lens handle", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        data: {
          defaultProfile: null,
        },
      },
    });

    const lens = new LensProfileProvider();
    const verifiedPayload = await lens.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      record: {},
    });
  });

  it("should return an error response when axios throws an error", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("some error"));

    const lens = new LensProfileProvider();
    const verifiedPayload = await lens.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["Lens provider get user handle error"],
    });
  });
});
