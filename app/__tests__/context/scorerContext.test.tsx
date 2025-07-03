import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { screen, render, waitFor } from "@testing-library/react";
import axios from "axios";
import { ScorerContext, ScorerContextProvider } from "../../context/scorerContext";
import { useCustomization } from "../../hooks/useCustomization";
import { usePlatforms } from "../../hooks/usePlatforms";

vi.mock("axios");
vi.mock("../../hooks/useCustomization");
vi.mock("../../hooks/usePlatforms");

// Helper functions to create V2 and legacy format responses
const createV2Response = ({
  address = "0x123",
  score = "10.00000",
  passing_score = true,
  threshold = "20.00000",
  last_score_timestamp = "2024-01-01T00:00:00Z",
  expiration_timestamp = null,
  error = null,
  stamps = {},
}: {
  address?: string;
  score?: string;
  passing_score?: boolean;
  threshold?: string;
  last_score_timestamp?: string;
  expiration_timestamp?: string | null;
  error?: string | null;
  stamps?: Record<
    string,
    {
      score: string;
      dedup: boolean;
      expiration_date: string;
    }
  >;
}) => ({
  data: {
    address,
    score,
    passing_score,
    threshold,
    last_score_timestamp,
    expiration_timestamp,
    error,
    stamps,
  },
});

// Legacy response helper removed - only using V2 format now

describe("ScorerContext", () => {
  const mockAddress = "0x123";
  const mockDbAccessToken = "test-token";

  const mockUsePlatforms = {
    platformSpecs: [],
    platformProviders: {},
    platforms: new Map(),
    getPlatformSpec: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(useCustomization).mockReturnValue({} as any);
    vi.mocked(usePlatforms).mockReturnValue(mockUsePlatforms as any);
    vi.clearAllMocks();
  });

  describe("API Response Handling", () => {
    it("should handle V2 API response format", async () => {
      const v2Response = createV2Response({
        score: "15.5",
        passing_score: true,
        threshold: "10.0",
        stamps: {
          Github: {
            score: "5.5",
            dedup: false,
            expiration_date: "2024-12-31",
          },
          Google: {
            score: "10.0",
            dedup: false,
            expiration_date: "2024-12-31",
          },
        },
      });

      vi.mocked(axios).mockResolvedValueOnce(v2Response as any);

      const TestComponent = () => {
        const context = React.useContext(ScorerContext);

        React.useEffect(() => {
          context.refreshScore(mockAddress, mockDbAccessToken);
        }, []);

        return (
          <div>
            <div data-testid="score">{context.score}</div>
            <div data-testid="stamp-scores">{JSON.stringify(context.stampScores)}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score")).toHaveTextContent("15.5");
        expect(screen.getByTestId("stamp-scores")).toHaveTextContent('{"Github":"5.5","Google":"10.0"}');
      });
    });

    it("should handle V2 API response format with deduplication", async () => {
      const v2Response = createV2Response({
        score: "15.5",
        passing_score: true,
        threshold: "10.0",
        stamps: {
          Github: {
            score: "5.5",
            dedup: false,
            expiration_date: "2024-12-31",
          },
          Google: {
            score: "10.0",
            dedup: true,
            expiration_date: "2024-12-31",
          },
        },
      });

      vi.mocked(axios).mockResolvedValueOnce(v2Response as any);

      const TestComponent = () => {
        const context = React.useContext(ScorerContext);

        React.useEffect(() => {
          context.refreshScore(mockAddress, mockDbAccessToken);
        }, []);

        return (
          <div>
            <div data-testid="score">{context.score}</div>
            <div data-testid="stamp-scores">{JSON.stringify(context.stampScores)}</div>
            <div data-testid="stamp-dedup">{JSON.stringify(context.stampDedupStatus)}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score")).toHaveTextContent("15.5");
        expect(screen.getByTestId("stamp-scores")).toHaveTextContent('{"Github":"5.5","Google":"10.0"}');
        expect(screen.getByTestId("stamp-dedup")).toHaveTextContent('{"Github":false,"Google":true}');
      });
    });

    it("should handle V2 API response format with high score", async () => {
      const v2Response = createV2Response({
        score: "25.0",
        passing_score: true,
        threshold: "20.0",
        stamps: {
          Github: {
            score: "15.0",
            dedup: false,
            expiration_date: "2024-12-31",
          },
          Discord: {
            score: "10.0",
            dedup: false,
            expiration_date: "2024-12-31",
          },
        },
      });

      vi.mocked(axios).mockResolvedValueOnce(v2Response as any);

      const TestComponent = () => {
        const context = React.useContext(ScorerContext);

        React.useEffect(() => {
          context.refreshScore(mockAddress, mockDbAccessToken);
        }, []);

        return (
          <div>
            <div data-testid="score">{context.score}</div>
            <div data-testid="raw-score">{context.rawScore}</div>
            <div data-testid="threshold">{context.threshold}</div>
            <div data-testid="passing-score">{context.passingScore ? "true" : "false"}</div>
            <div data-testid="stamp-scores">{JSON.stringify(context.stampScores)}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score")).toHaveTextContent("25");
        expect(screen.getByTestId("raw-score")).toHaveTextContent("25");
        expect(screen.getByTestId("threshold")).toHaveTextContent("20");
        expect(screen.getByTestId("passing-score")).toHaveTextContent("true");
        expect(screen.getByTestId("stamp-scores")).toHaveTextContent('{"Github":"15.0","Discord":"10.0"}');
      });
    });

    it("should preserve deduplication information in stampScores", async () => {
      const v2Response = createV2Response({
        score: "10.0",
        passing_score: false,
        threshold: "20.0",
        stamps: {
          Github: {
            score: "10.0",
            dedup: false,
            expiration_date: "2024-12-31",
          },
          Google: {
            score: "0",
            dedup: true,
            expiration_date: "2024-12-31",
          },
          Discord: {
            score: "0",
            dedup: true,
            expiration_date: "2024-12-31",
          },
        },
      });

      vi.mocked(axios).mockResolvedValueOnce(v2Response as any);

      const TestComponent = () => {
        const context = React.useContext(ScorerContext);

        React.useEffect(() => {
          context.refreshScore(mockAddress, mockDbAccessToken);
        }, []);

        return (
          <div>
            <div data-testid="stamp-scores">{JSON.stringify(context.stampScores)}</div>
            <div data-testid="stamp-dedup">{JSON.stringify(context.stampDedupStatus)}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        const stampScores = JSON.parse(screen.getByTestId("stamp-scores").textContent || "{}");
        const stampDedup = JSON.parse(screen.getByTestId("stamp-dedup").textContent || "{}");
        // Verify that deduplicated stamps have score of 0
        expect(stampScores.Google).toBe("0");
        expect(stampScores.Discord).toBe("0");
        // Verify that non-deduplicated stamps have their actual score
        expect(stampScores.Github).toBe("10.0");
        // Verify dedup status is preserved
        expect(stampDedup.Google).toBe(true);
        expect(stampDedup.Discord).toBe(true);
        expect(stampDedup.Github).toBe(false);
      });
    });

    it("should handle stamps field being undefined", async () => {
      const v2Response = createV2Response({
        score: "0",
        passing_score: false,
        threshold: "10.0",
        stamps: {},
      });

      vi.mocked(axios).mockResolvedValueOnce(v2Response as any);

      const TestComponent = () => {
        const context = React.useContext(ScorerContext);

        React.useEffect(() => {
          context.refreshScore(mockAddress, mockDbAccessToken);
        }, []);

        return (
          <div>
            <div data-testid="score">{context.score}</div>
            <div data-testid="stamp-scores">{JSON.stringify(context.stampScores)}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score")).toHaveTextContent("0");
        expect(screen.getByTestId("stamp-scores")).toHaveTextContent("{}");
      });
    });
  });

  describe("Error handling and state machine", () => {
    it("should handle API errors before setting any data", async () => {
      const apiErrorResponse = createV2Response({
        error: "Invalid scorer configuration",
        score: "15.5", // This should not be set when there's an error
      });

      vi.mocked(axios).mockResolvedValueOnce(apiErrorResponse as any);

      const TestComponent = () => {
        const context = React.useContext(ScorerContext);

        React.useEffect(() => {
          context.refreshScore(mockAddress, mockDbAccessToken);
        }, []);

        return (
          <div>
            <div data-testid="score-status">{context.scoreState.status}</div>
            <div data-testid="score-error">
              {context.scoreState.status === "error" ? context.scoreState.error : "no error"}
            </div>
            <div data-testid="score">{context.score}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score-status")).toHaveTextContent("error");
        expect(screen.getByTestId("score-error")).toHaveTextContent("Invalid scorer configuration");
        // Score should remain at initial value (0) since error was thrown before setting data
        expect(screen.getByTestId("score")).toHaveTextContent("0");
      });
    });

    it("should handle network errors", async () => {
      vi.mocked(axios).mockRejectedValue(new Error("Network timeout"));

      const TestComponent = () => {
        const context = React.useContext(ScorerContext);

        React.useEffect(() => {
          context.refreshScore(mockAddress, mockDbAccessToken);
        }, []);

        return (
          <div>
            <div data-testid="score-status">{context.scoreState.status}</div>
            <div data-testid="score-error">
              {context.scoreState.status === "error" ? context.scoreState.error : "no error"}
            </div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score-status")).toHaveTextContent("error");
        expect(screen.getByTestId("score-error")).toHaveTextContent("Network timeout");
      });
    });

    it("should transition through loading -> success states", async () => {
      const successResponse = createV2Response({
        score: "25.5",
        passing_score: true,
      });

      vi.mocked(axios).mockResolvedValueOnce(successResponse as any);

      const states: string[] = [];
      const TestComponent = () => {
        const context = React.useContext(ScorerContext);

        // Track state changes
        React.useEffect(() => {
          states.push(context.scoreState.status);
        });

        React.useEffect(() => {
          context.refreshScore(mockAddress, mockDbAccessToken);
        }, []);

        return (
          <div>
            <div data-testid="score-status">{context.scoreState.status}</div>
            <div data-testid="score">{context.score}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score-status")).toHaveTextContent("success");
        expect(screen.getByTestId("score")).toHaveTextContent("25.5");
      });

      // Should have transitioned: loading -> loading (during request) -> success
      expect(states).toContain("loading");
      expect(states).toContain("success");
    });

    it("should handle V2 format errors", async () => {
      const v2ErrorResponse = createV2Response({
        score: "0",
        passing_score: false,
        threshold: "20.0",
        error: "Score calculation failed",
      });

      vi.mocked(axios).mockResolvedValueOnce(v2ErrorResponse as any);

      const TestComponent = () => {
        const context = React.useContext(ScorerContext);

        React.useEffect(() => {
          context.refreshScore(mockAddress, mockDbAccessToken);
        }, []);

        return (
          <div>
            <div data-testid="score-status">{context.scoreState.status}</div>
            <div data-testid="score-error">
              {context.scoreState.status === "error" ? context.scoreState.error : "no error"}
            </div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score-status")).toHaveTextContent("error");
        expect(screen.getByTestId("score-error")).toHaveTextContent("Score calculation failed");
      });
    });
  });

  describe("Score calculation with deduplicated stamps", () => {
    it("should calculate platform scores correctly with deduplicated stamps", async () => {
      const mockPlatformProviders = {
        Github: [
          { name: "GithubContributor", isDeprecated: false },
          { name: "GithubFollower", isDeprecated: false },
        ],
        Google: [{ name: "GoogleAccount", isDeprecated: false }],
      };

      const mockStampWeights = {
        GithubContributor: "5.0",
        GithubFollower: "3.0",
        GoogleAccount: "2.0",
      };

      vi.mocked(usePlatforms).mockReturnValue({
        ...mockUsePlatforms,
        platformProviders: mockPlatformProviders,
        platforms: new Map([
          ["Github", {}],
          ["Google", {}],
        ]),
        getPlatformSpec: vi.fn((id) => ({
          platform: id,
          name: id,
          description: `${id} platform`,
          connectMessage: "Connect",
        })),
      } as any);

      const responseWithDedupScores = createV2Response({
        score: "5.0",
        passing_score: false,
        threshold: "10.0",
        stamps: {
          GithubContributor: {
            score: "5.0",
            dedup: false,
            expiration_date: "2024-12-31",
          },
          GithubFollower: {
            score: "0",
            dedup: true,
            expiration_date: "2024-12-31",
          },
          GoogleAccount: {
            score: "0",
            dedup: true,
            expiration_date: "2024-12-31",
          },
        },
      });

      vi.mocked(axios).mockImplementation((config: any) => {
        if (config.url && config.url.includes("/weights")) {
          return Promise.resolve({ data: mockStampWeights });
        }
        return Promise.resolve(responseWithDedupScores);
      });

      // Mock axios.get specifically for weights endpoint
      vi.mocked(axios.get).mockImplementation((url: string) => {
        if (url.includes("/weights")) {
          return Promise.resolve({ data: mockStampWeights });
        }
        return Promise.reject(new Error("Unexpected URL"));
      });

      const TestComponent = () => {
        const context = React.useContext(ScorerContext);

        React.useEffect(() => {
          context.fetchStampWeights();
          context.refreshScore(mockAddress, mockDbAccessToken);
        }, []);

        return (
          <div>
            <div data-testid="scored-platforms">{JSON.stringify(context.scoredPlatforms)}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        const scoredPlatforms = JSON.parse(screen.getByTestId("scored-platforms").textContent || "[]");

        const githubPlatform = scoredPlatforms.find((p: any) => p.platform === "Github");
        expect(githubPlatform).toBeDefined();
        expect(githubPlatform.possiblePoints).toBe(8); // 5 + 3
        expect(githubPlatform.earnedPoints).toBe(5); // Only GithubContributor counted

        const googlePlatform = scoredPlatforms.find((p: any) => p.platform === "Google");
        expect(googlePlatform).toBeDefined();
        expect(googlePlatform.possiblePoints).toBe(2);
        expect(googlePlatform.earnedPoints).toBe(0); // Deduplicated, so 0
      });
    });
  });
});
