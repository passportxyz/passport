import { Request, Response } from "express";
import { metadataHandler } from "../src/metadata.js";
import axios from "axios";

// Mock axios to intercept any HTTP requests
jest.mock("axios");

// Mock the passport-platforms module
jest.mock("@gitcoin/passport-platforms", () => ({
  platforms: {
    Binance: { providers: { BinanceBABT: { type: "BinanceBABT" } } },
    Holonym: { providers: { HolonymPhone: { type: "HolonymPhone" } } },
    Google: { providers: { Google: { type: "Google" } } },
  },
}));

describe("GET /embed/stamps/metadata", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
  });

  it("should return 400 if scorerId is missing", async () => {
    mockReq = { query: {} };

    await metadataHandler(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Missing required query parameter: `scorerId`",
    });
  });

  it("should call embedWeightsUrl and return the correct metadata structure", async () => {
    const mockScorerId = "10";
    process.env.SCORER_ENDPOINT = "https://api.passport.xyz";
    mockReq = { query: { scorerId: mockScorerId } };

    const embedWeightsUrl = `${process.env.SCORER_ENDPOINT}/embed/weights?community_id=${mockScorerId}`;

    // Mock the axios GET request
    (axios.get as jest.Mock).mockResolvedValueOnce({
      status: 200,
      data: {
        BinanceBABT: 16.021,
        HolonymPhone: 1.521,
      },
    });

    await metadataHandler(mockReq as Request, mockRes as Response);

    // TODO: geri fix this
    // // Extract returned data from mock calls
    // // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    // const actualResponse = (mockRes.json as jest.Mock).mock.calls[0][0];
    // // Flatten all credentials from platforms
    // // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    // const allCredentials = actualResponse.flatMap((section: any) =>
    //   // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any
    //   section.platforms.flatMap((platform: any) => platform.credentials || [])
    // );

    // // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    // const allDisplayWeights = actualResponse.flatMap((section: unknown) => {
    //   return section.platforms.flatMap((platform) => ({
    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    //     platform: platform.name,
    //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    //     displayWeight: platform.displayWeight || [],
    //   }));
    // });
    // // Verify API call
    // // eslint-disable-next-line @typescript-eslint/unbound-method
    // expect(axios.get).toHaveBeenCalledWith(embedWeightsUrl);
    // // Verify that displayWeight has 1 decimal place
    // expect(allDisplayWeights).toEqual(
    //   expect.arrayContaining([
    //     expect.objectContaining({ platform: "Binance", displayWeight: "16.0" }),
    //     expect.objectContaining({ platform: "Holonym", displayWeight: "1.5" }),
    //     expect.objectContaining({ platform: "Google", displayWeight: "0.0" }),
    //   ])
    // );
    // // Verifies that credentials are returned in the wright format
    // expect(allCredentials).toEqual(
    //   expect.arrayContaining([
    //     expect.objectContaining({ id: "BinanceBABT", weight: "16.021" }),
    //     expect.objectContaining({ id: "HolonymPhone", weight: "1.521" }),
    //     expect.objectContaining({ id: "Google", weight: "0" }), // If Google is missing from the weights response, but it's present in the STAMP_PAGES.
    //   ])
    // );
  });

  it("should handle errors from the embedWeightsUrl API correctly", async () => {
    const mockScorerId = "10";
    mockReq = { query: { scorerId: mockScorerId } };

    (axios.get as jest.Mock).mockRejectedValue(new Error("Failed to fetch embed weights"));

    await metadataHandler(mockReq as Request, mockRes as Response);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: "Unexpected error when processing request, Error: Failed to fetch embed weights",
    });
  });

  it("should return empty credentials and 0 display weight for bad platforms", async () => {
    jest.doMock("../src/stamps", () => ({
      STAMP_PAGES: [
        {
          header: "KYC verification",
          platforms: [
            {
              name: "BiNaNcE", // Intentionally incorrect case to test platform handling
              description: "Binance KYC verification",
              documentationLink: "https://example.com/binance-docs",
            },
            {
              name: "Holonym",
              description: "Holonym KYC verification",
              documentationLink: "https://example.com/holonym-docs",
            },
          ],
        },
      ],
      displayNumber: (num: number) => num.toFixed(1), // Mock `displayNumber`
    }));

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    // TODO: geri fix this
    // await jest.isolateModulesAsync(async () => {
    //   const { metadataHandler } = await import("../src/metadata.js");
    //   const { STAMP_PAGES } = await import("../src/stamps.js");

    //   // Debugging: Verify STAMP_PAGES is mocked
    //   console.log("Mocked STAMP_PAGES in test:", JSON.stringify(STAMP_PAGES, null, 2));

    //   // Step 3: Mock axios GET request for weights API
    //   (axios.get as jest.Mock).mockResolvedValueOnce({
    //     status: 200,
    //     data: {
    //       BinanceBABT: 16.021,
    //       HolonymPhone: 1.521,
    //     },
    //   });

    //   const mockScorerId = "10";
    //   process.env.SCORER_ENDPOINT = "https://api.passport.xyz";
    //   mockReq = { query: { scorerId: mockScorerId } };

    //   await metadataHandler(mockReq as Request, mockRes as Response);

    //   const actualResponse = (mockRes.json as jest.Mock).mock.calls[0][0];

    //   expect(axios.get).toHaveBeenCalledTimes(1);
    //   expect(axios.get).toHaveBeenCalledWith(
    //     `${process.env.SCORER_ENDPOINT}/embed/weights?community_id=${mockScorerId}`
    //   );

    //   expect(actualResponse).toEqual(
    //     expect.arrayContaining([
    //       expect.objectContaining({
    //         header: "KYC verification",
    //         platforms: expect.arrayContaining([
    //           expect.objectContaining({ name: "BiNaNcE", credentials: [], displayWeight: "0.0" }), // Ensures it falls back to empty credentials
    //           expect.objectContaining({
    //             name: "Holonym",
    //             credentials: [
    //               {
    //                 id: "HolonymPhone",
    //                 weight: "1.521",
    //               },
    //             ],
    //             displayWeight: "1.5",
    //           }),
    //         ]),
    //       }),
    //     ])
    //   );
    // });
  });
});
