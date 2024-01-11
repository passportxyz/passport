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

const mockTokenAddress = "0x06012c8cf97bead5deae237070f9587f8e7a266d";
const mockTokenId = "100000";
const tokenType = "ERC721";

const mockContracts = [
  {
    address: mockTokenAddress,
    tokenId: mockTokenId,
    tokenType,
  },
];

describe("Attempt verification", function () {
  it.each([
    [400, 1, false],
    [500, 200, false],
  ])(
    " - when exception is thrown with status of %p and totalCount is %p valid es expected to be %p",
    async (httpStatus, totalCount: number, expectedValid: boolean) => {
      (axios.get as jest.Mock).mockImplementationOnce(() => {
        throw new Error("bad request");
      });
      const nftProvider = new NFTProvider();
      await expect(async () => {
        return await nftProvider.verify({
          address: MOCK_ADDRESS,
        } as unknown as RequestPayload);
      }).rejects.toThrow(
        // eslint-disable-next-line quotes
        new Error("bad request")
      );

      // Check the request to get the NFTs
      expect(axios.get).toHaveBeenCalledTimes(1);
      expect(mockedAxios.get).toBeCalledWith(getNFTEndpoint(), {
        params: {
          withMetadata: "true",
          owner: MOCK_ADDRESS_LOWER,
          orderBy: "transferTime",
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
          contracts: [],
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
      errors: ["You do not own any NFTs."],
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
            contracts: mockContracts,
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
          withMetadata: "true",
          owner: MOCK_ADDRESS_LOWER,
          orderBy: "transferTime",
        },
      });
      expect(nftPayload).toEqual({
        valid: true,
        record: {
          tokenAddress: mockTokenAddress,
          tokenId: mockTokenId,
        },
        errors: [],
      });
    }
  );
  it("should not validate an ERC1155 token", async () => {
    (axios.get as jest.Mock).mockImplementation((url) => {
      return Promise.resolve({
        status: 200,
        data: {
          totalCount: 1,
          contracts: [
            {
              ...mockContracts[0],
              tokenType: "ERC1155",
            },
          ],
        },
      });
    });

    const nftProvider = new NFTProvider();

    await expect(
      async () =>
        await nftProvider.verify({
          address: MOCK_ADDRESS,
        } as unknown as RequestPayload)
    ).rejects.toThrowError("Unable to find an ERC721 token that you own.");
  });
});
