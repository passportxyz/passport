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
          ownedHandles: {
            items: [
              {
                id: MOCK_ADDRESS,
                fullHandle: MOCK_HANDLE,
                ownedBy: MOCK_ADDRESS,
              },
            ],
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
      errors: [],
      record: {
        handle: MOCK_HANDLE,
      },
    });
  });

  it("should return false if owner addresses do not match", async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: {
        data: {
          ownedHandles: {
            items: [
              {
                id: MOCK_ADDRESS,
                fullHandle: MOCK_HANDLE,
                ownedBy: MOCK_FAKE_ADDRESS,
              },
            ],
          },
        },
      },
    });

    const lens = new LensProfileProvider();
    const verifiedPayload = await lens.verify({
      address: MOCK_ADDRESS_LOWER,
    } as RequestPayload);

    expect(verifiedPayload.valid).toEqual(false);
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
      errors: ["We were unable to retrieve a Lens handle for your address."],
      record: undefined,
    });
  });

  it("should return an error response when axios throws an error", async () => {
    mockedAxios.post.mockRejectedValueOnce(new Error("some error"));

    const lens = new LensProfileProvider();
    await expect(
      async () =>
        await lens.verify({
          address: MOCK_ADDRESS_LOWER,
        } as RequestPayload)
    ).rejects.toThrowError("Error verifying Snapshot proposals: {}.");
  });
});
