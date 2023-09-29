/* eslint-disable */
// ---- Test subject
import { getNFTEndpoint, NFTProvider } from "../nft";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";
import { ProviderExternalVerificationError } from "../../../types";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;
const MOCK_ADDRESS = "0xcF314CE817E25b4F784bC1f24c9A79A525fEC50f";
const MOCK_ADDRESS_LOWER = MOCK_ADDRESS.toLocaleLowerCase();

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Attempt verification", function () {
  it.each([
    [400, 1, false],
    [500, 200, false],
  ])(
    " - when exeption is thrown with status of %p and totalCount is %p valid es expected to be %p",
    async (httpStatus, totalCount: number, expectedValid: boolean) => {
      (axios.get as jest.Mock).mockRejectedValueOnce("bad request");
      const nftProvider = new NFTProvider();
      await expect(async () => {
        return await nftProvider.verify({
          address: MOCK_ADDRESS,
        } as unknown as RequestPayload);
      }).rejects.toThrow(
        // eslint-disable-next-line quotes
        new ProviderExternalVerificationError("NFT check error: {}")
      );

      // Check the request to get the NFTs
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toBeCalledWith(getNFTEndpoint(), {
        params: {
          withMetadata: "false",
          owner: MOCK_ADDRESS_LOWER,
          pageSize: 1,
        },
      });
    }
  );
  it("should return an error when request is successful but they do not qualify", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        status: 200,
        data: {
          totalCount: 0,
          ownedNfts: [],
        },
      });
    });

    const nftProvider = new NFTProvider();

    const nftPayload = await nftProvider.verify({
      address: MOCK_ADDRESS,
    } as unknown as RequestPayload);

    expect(nftPayload).toEqual({
      valid: false,
      record: undefined,
      errors: ["You do not have the required amount of NFTs -- Your NFT count: 0."],
    });
  });
  it.each([
    [200, 1, true],
    [200, 200, true],
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
          pageSize: 1,
        },
      });
      expect(nftPayload).toEqual({
        valid: true,
        record: {
          address: MOCK_ADDRESS_LOWER,
          "NFT#numNFTsGte": "1",
        },
        errors: [],
      });
    }
  );
});
