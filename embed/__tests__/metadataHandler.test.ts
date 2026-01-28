import { jest, it, describe, expect, beforeEach } from "@jest/globals";
import axios from "axios";
import request from "supertest";
import { app } from "../src/server.js";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the passport-platforms module
jest.unstable_mockModule("@gitcoin/passport-platforms", () => ({
  platforms: {
    Binance: { providers: { BinanceBABT: { type: "BinanceBABT" } } },
    Holonym: { providers: { HolonymPhone: { type: "HolonymPhone" } } },
    Google: { providers: { Google: { type: "Google" } } },
  },
}));

describe("GET /embed/stamps/metadata", () => {
  let originalScorerEndpoint: string | undefined;
  const mockScorerId = "10";
  const embedConfigUrl = `${process.env.SCORER_ENDPOINT}/internal/embed/config?community_id=${mockScorerId}`;

  beforeEach(() => {
    originalScorerEndpoint = process.env.SCORER_ENDPOINT;
    process.env.SCORER_ENDPOINT = "https://api.passport.xyz";
    jest.clearAllMocks();

    mockedAxios.get.mockResolvedValueOnce({
      data: {
        embed_rate_limit: "125/15m",
      },
    });
  });

  afterEach(() => {
    process.env.SCORER_ENDPOINT = originalScorerEndpoint;
  });

  it("should return 400 if scorerId is missing", async () => {
    const response = await request(app)
      .get("/embed/stamps/metadata")
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .expect(400)
      .expect("Content-Type", /json/);

    expect(response.body).toEqual({
      code: 400,
      error: "Missing required query parameter: `scorerId`",
    });
  });

  it("should call embedConfigUrl and return the correct metadata structure", async () => {
    // Mock the axios GET request
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        weights: {
          BinanceBABT: 16.021,
          HolonymPhone: 1.521,
        },
        stamp_sections: [],
      },
    });

    const response = await request(app)
      .get(`/embed/stamps/metadata?scorerId=${mockScorerId}`)
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .expect(200)
      .expect("Content-Type", /json/);

    expect(response.body.length).toBeGreaterThan(1);
    expect(response.body).toMatchObject(
      expect.arrayContaining([
        {
          header: expect.any(String),
          platforms: expect.arrayContaining([
            expect.objectContaining({
              description: expect.any(String),
              name: expect.any(String),
              credentials: expect.any(Array),
              displayWeight: expect.any(String),
              documentationLink: expect.any(String),
            }),
          ]),
        },
      ])
    );
  });

  it("should filter out platforms with 0 displayWeight", async () => {
    // Mock the axios GET request with all weights set to 0
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        weights: {
          BinanceBABT: 0,
          HolonymPhone: 0,
          Google: 0,
          Discord: 0,
          Github: 0,
          Linkedin: 0,
        },
        stamp_sections: [],
      },
    });

    const response = await request(app)
      .get(`/embed/stamps/metadata?scorerId=${mockScorerId}`)
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .expect(200)
      .expect("Content-Type", /json/);

    // With all weights set to 0, all platforms should be filtered out
    // So we should have pages but no platforms
    response.body.forEach((page: any) => {
      expect(page.platforms).toHaveLength(0);
    });
  });

  it("should use custom stamp sections when available", async () => {
    // Mock the combined config response with weights and custom sections
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        weights: {
          BinanceBABT: 10.0,
          Discord: 5.0,
        },
        stamp_sections: [
          {
            title: "Custom Section 1",
            order: 0,
            items: [{ platform_id: "Binance", order: 0 }],
          },
          {
            title: "Custom Section 2",
            order: 1,
            items: [{ platform_id: "Discord", order: 0 }],
          },
        ],
      },
    });

    const response = await request(app)
      .get(`/embed/stamps/metadata?scorerId=${mockScorerId}`)
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .expect(200)
      .expect("Content-Type", /json/);

    // Verify custom section titles are used
    expect(response.body).toMatchObject(
      expect.arrayContaining([
        expect.objectContaining({
          header: "Custom Section 1",
        }),
        expect.objectContaining({
          header: "Custom Section 2",
        }),
      ])
    );
  });

  it("should fall back to default STAMP_PAGES when stamp_sections is empty", async () => {
    // Mock the config response with empty stamp_sections
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        weights: {
          BinanceBABT: 10.0,
          Discord: 5.0,
        },
        stamp_sections: [],
      },
    });

    const response = await request(app)
      .get(`/embed/stamps/metadata?scorerId=${mockScorerId}`)
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .expect(200)
      .expect("Content-Type", /json/);

    // Should still return data using default STAMP_PAGES
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body).toMatchObject(
      expect.arrayContaining([
        {
          header: expect.any(String),
          platforms: expect.any(Array),
        },
      ])
    );
  });

  describe("unexpected errors", () => {
    it("should handle errors from the embedConfigUrl API correctly", async () => {
      mockedAxios.get.mockImplementationOnce(() => {
        throw new Error("Failed to fetch embed weights");
      });

      const response = await request(app)
        .get(`/embed/stamps/metadata?scorerId=${mockScorerId}`)
        .set("Accept", "application/json")
        .set("x-api-key", "test")
        .expect(500)
        .expect("Content-Type", /json/);

      expect(response.body).toEqual({
        code: 500,
        error: expect.stringMatching(/Unexpected server error \(ID: \S+\)/),
      });
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
    //   mockedAxios.get.mockResolvedValueOnce({
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

    //   expect(mockedAxios.get).toHaveBeenCalledTimes(1);
    //   expect(mockedAxios.get).toHaveBeenCalledWith(
    //     `${process.env.SCORER_ENDPOINT}/internal/embed/weights?community_id=${mockScorerId}`
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
