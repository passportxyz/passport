/* eslint-disable */
// ---- Test subject
import { getNFTEndpoint, NFTProvider } from "../nft";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLocaleLowerCase();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Attempt verification", function () {
  it.each([
    [200, 0, false],
    [200, 1, true],
    [200, 200, true],
    [300, 0, false],
    [400, 1, false],
    [500, 200, false],
  ])(
    " - when status is %p and totalCount is %p valid es expected to be %p",
    async (httpStatus, totalCount: number, expectedValid: boolean) => {
      (axios.get as jest.Mock).mockImplementation((url) => {
        return Promise.resolve({
          status: httpStatus,
          data: {
            totalCount: totalCount,
            ownedNfts: [],
          },
        });
      });

      const nftProvider = new NFTProvider();
      const nftPayload = await nftProvider.verify({
        address: MOCK_ADDRESS,
      } as unknown as RequestPayload);

      // Check the request to get the NFTs
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toBeCalledWith(getNFTEndpoint(), {
        params: {
          withMetadata: "false",
          owner: MOCK_ADDRESS_LOWER,
        },
      });

      if (expectedValid) {
        expect(nftPayload).toEqual({
          valid: true,
          record: {
            address: MOCK_ADDRESS_LOWER,
            "NFT#numNFTsGte": "1",
          },
        });
      } else {
        expect(nftPayload).toEqual({
          valid: false,
        });
      }
    }
  );

  it("should return invalid payload when unable to get NFTs (exception thrown)", async () => {
    mockedAxios.get.mockImplementation(async () => {
      throw "some kind of error";
    });

    const nftProvider = new NFTProvider();
    const nftPayload = await nftProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(axios.get).toHaveBeenCalledTimes(1);
    expect(nftPayload).toMatchObject({ valid: false });
  });
});
