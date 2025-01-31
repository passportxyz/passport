import { Request, Response } from "express";
import { metadataHandler } from "../src/metadata";
import axios from "axios";

// Mock axios to intercept any HTTP requests
jest.mock("axios");

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

    // Extract returned data from mock calls
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const actualResponse = (mockRes.json as jest.Mock).mock.calls[0][0];

    // Flatten all credentials from platforms
    const allCredentials = actualResponse.flatMap((section: any) =>
      section.platforms.flatMap((platform: any) => platform.credentials || [])
    );

    // Verify API call
    expect(axios.get).toHaveBeenCalledWith(embedWeightsUrl);

    expect(allCredentials).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "BinanceBABT", weight: "16.021" }),
        expect.objectContaining({ id: "HolonymPhone", weight: "1.521" }),
        expect.objectContaining({ id: "Google", weight: "0" }), // If Google is missing from the weights response, but it's present in the STAMP_PAGES.
      ])
    );
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
});
