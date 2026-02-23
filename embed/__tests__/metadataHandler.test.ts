import { jest, it, describe, expect, beforeEach } from "@jest/globals";
import axios from "axios";
import request from "supertest";
import { app } from "../src/server.js";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

// Mock the passport-platforms module
jest.unstable_mockModule("@gitcoin/passport-platforms", () => ({
  platforms: {
    Binance: { PlatformDetails: { icon: "./assets/binanceStampIcon.svg" }, providers: [{ type: "BinanceBABT" }] },
    Holonym: { providers: [{ type: "HolonymPhone" }] },
    Google: { providers: [{ type: "Google" }] },
    AllowList: { PlatformDetails: { icon: "./assets/star-light.svg" }, providers: [] },
    CustomGithub: { PlatformDetails: { icon: "./assets/dev-icon.svg" }, providers: [] },
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

  it("should include Guest List and Developer List sections when custom_stamps is present", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        weights: {
          "AllowList#VIPList": 10.0,
          "DeveloperList#TestRepo#abc12345": 5.0,
        },
        stamp_sections: [],
        custom_stamps: {
          allow_list_stamps: [
            {
              provider_id: "AllowList#VIPList",
              display_name: "VIP List",
              description: "Verify you are part of this community.",
              weight: 10.0,
            },
          ],
          developer_list_stamps: [
            {
              provider_id: "DeveloperList#TestRepo#abc12345",
              display_name: "Test Repo Contributor",
              description: "Verify contributions to TestRepo",
              weight: 5.0,
            },
          ],
        },
      },
    });

    const response = await request(app)
      .get(`/embed/stamps/metadata?scorerId=${mockScorerId}`)
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .expect(200)
      .expect("Content-Type", /json/);

    const guestListSection = response.body.find((p: { header: string }) => p.header === "Guest List");
    const developerListSection = response.body.find((p: { header: string }) => p.header === "Developer List");

    expect(guestListSection).toBeDefined();
    expect(guestListSection.platforms).toHaveLength(1);
    expect(guestListSection.platforms[0]).toMatchObject({
      name: "VIP List",
      platformId: "AllowList",
      credentials: [{ id: "AllowList#VIPList", weight: "10" }],
      displayWeight: "10.0",
    });

    expect(developerListSection).toBeDefined();
    expect(developerListSection.platforms).toHaveLength(1);
    expect(developerListSection.platforms[0]).toMatchObject({
      name: "Test Repo Contributor",
      platformId: "DeveloperList",
      credentials: [{ id: "DeveloperList#TestRepo#abc12345", weight: "5" }],
      displayWeight: "5.0",
    });
  });

  it("should handle unified platforms array format", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        weights: {},
        stamp_sections: [
          {
            title: "Guest List",
            order: 0,
            items: [{ platform_id: "AllowList#VIPList", order: 0 }],
          },
          {
            title: "Developer List",
            order: 1,
            items: [{ platform_id: "DeveloperList#TestRepo#abc12345", order: 0 }],
          },
        ],
        platforms: [
          {
            platform_id: "AllowList#VIPList",
            icon_platform_id: "AllowList",
            name: "VIP List",
            description: "Verify you are part of this community.",
            documentation_link: "https://example.com/guest-list",
            requires_signature: false,
            requires_popup: false,
            requires_sdk_flow: false,
            credentials: [{ id: "AllowList#VIPList", weight: "10.0" }],
          },
          {
            platform_id: "DeveloperList#TestRepo#abc12345",
            icon_platform_id: "CustomGithub",
            name: "Test Repo Contributor",
            description: "Verify contributions to TestRepo",
            documentation_link: "https://example.com/dev-list",
            requires_signature: true,
            requires_popup: true,
            requires_sdk_flow: false,
            credentials: [{ id: "DeveloperList#TestRepo#abc12345", weight: "5.0" }],
          },
        ],
      },
    });

    const response = await request(app)
      .get(`/embed/stamps/metadata?scorerId=${mockScorerId}`)
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .expect(200);

    const guestListSection = response.body.find((p: { header: string }) => p.header === "Guest List");
    const developerListSection = response.body.find((p: { header: string }) => p.header === "Developer List");

    expect(guestListSection).toBeDefined();
    expect(guestListSection.platforms).toHaveLength(1);
    expect(guestListSection.platforms[0]).toMatchObject({
      name: "VIP List",
      platformId: "AllowList#VIPList",
      credentials: [{ id: "AllowList#VIPList", weight: "10.0" }],
      displayWeight: "10.0",
    });

    expect(developerListSection).toBeDefined();
    expect(developerListSection.platforms).toHaveLength(1);
    expect(developerListSection.platforms[0]).toMatchObject({
      name: "Test Repo Contributor",
      platformId: "DeveloperList#TestRepo#abc12345",
      credentials: [{ id: "DeveloperList#TestRepo#abc12345", weight: "5.0" }],
      displayWeight: "5.0",
      requiresSignature: true,
      requiresPopup: true,
    });
  });

  it("should support multiple custom platforms in same section", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        weights: {},
        stamp_sections: [
          {
            title: "Custom Stamps",
            order: 0,
            items: [
              { platform_id: "AllowList#VIPList", order: 0 },
              { platform_id: "DeveloperList#TestRepo#abc12345", order: 1 },
            ],
          },
        ],
        platforms: [
          {
            platform_id: "AllowList#VIPList",
            icon_platform_id: "AllowList",
            name: "VIP List",
            description: "Custom allow list",
            requires_signature: false,
            requires_popup: false,
            requires_sdk_flow: false,
            credentials: [{ id: "AllowList#VIPList", weight: "5.0" }],
          },
          {
            platform_id: "DeveloperList#TestRepo#abc12345",
            icon_platform_id: "CustomGithub",
            name: "Test Repo",
            description: "Developer contributions",
            requires_signature: true,
            requires_popup: true,
            requires_sdk_flow: false,
            credentials: [{ id: "DeveloperList#TestRepo#abc12345", weight: "3.0" }],
          },
        ],
      },
    });

    const response = await request(app)
      .get(`/embed/stamps/metadata?scorerId=${mockScorerId}`)
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .expect(200);

    const section = response.body.find((p: { header: string }) => p.header === "Custom Stamps");
    expect(section).toBeDefined();
    expect(section.platforms).toHaveLength(2);

    // AllowList custom platform
    expect(section.platforms[0]).toMatchObject({
      name: "VIP List",
      platformId: "AllowList#VIPList",
      credentials: [{ id: "AllowList#VIPList", weight: "5.0" }],
      displayWeight: "5.0",
    });

    // DeveloperList custom platform in the same section
    expect(section.platforms[1]).toMatchObject({
      name: "Test Repo",
      platformId: "DeveloperList#TestRepo#abc12345",
      credentials: [{ id: "DeveloperList#TestRepo#abc12345", weight: "3.0" }],
      displayWeight: "3.0",
      requiresSignature: true,
      requiresPopup: true,
    });
  });

  it("should prefer platforms field over custom_stamps when both present", async () => {
    mockedAxios.get.mockResolvedValueOnce({
      status: 200,
      data: {
        weights: {},
        stamp_sections: [
          {
            title: "Guest List",
            order: 0,
            items: [{ platform_id: "AllowList#VIPList", order: 0 }],
          },
        ],
        platforms: [
          {
            platform_id: "AllowList#VIPList",
            icon_platform_id: "AllowList",
            name: "VIP List (from platforms)",
            description: "From platforms field",
            credentials: [{ id: "AllowList#VIPList", weight: "10.0" }],
          },
        ],
        // This should be ignored when platforms is present
        custom_stamps: {
          allow_list_stamps: [
            {
              provider_id: "AllowList#VIPList",
              display_name: "VIP List (from custom_stamps)",
              weight: 10.0,
            },
          ],
        },
      },
    });

    const response = await request(app)
      .get(`/embed/stamps/metadata?scorerId=${mockScorerId}`)
      .set("Accept", "application/json")
      .set("x-api-key", "test")
      .expect(200);

    const guestListSection = response.body.find((p: { header: string }) => p.header === "Guest List");
    expect(guestListSection).toBeDefined();
    // Should use the name from platforms field, not custom_stamps
    expect(guestListSection.platforms[0].name).toBe("VIP List (from platforms)");
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
