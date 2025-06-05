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

const createLegacyResponse = ({
  status = "DONE",
  score = "10.0",
  rawScore = "10.0",
  threshold = "20.0",
  stamps = {},
  stamp_scores = null,
}: {
  status?: string;
  score?: string;
  rawScore?: string;
  threshold?: string;
  stamps?: Record<string, any>;
  stamp_scores?: Record<string, string> | null;
}) => ({
  data: {
    status,
    score,
    evidence: {
      rawScore,
      threshold,
    },
    ...(stamp_scores ? { stamp_scores } : { stamps }),
  },
});

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
    it("should handle old API response format (stamp_scores field)", async () => {
      const oldFormatResponse = {
        data: {
          status: "DONE",
          score: "15.5",
          evidence: {
            rawScore: "15.5",
            threshold: "10.0",
          },
          stamp_scores: {
            Github: "5.5",
            Google: "10.0",
          },
        },
      };

      vi.mocked(axios).mockResolvedValueOnce(oldFormatResponse as any);

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

    it("should handle new API response format (stamps field with objects)", async () => {
      const newFormatResponse = {
        data: {
          status: "DONE",
          score: "15.5",
          evidence: {
            rawScore: "15.5",
            threshold: "10.0",
          },
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
        },
      };

      vi.mocked(axios).mockResolvedValueOnce(newFormatResponse as any);

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
        // The context should extract just the scores from the new format
        expect(screen.getByTestId("stamp-scores")).toHaveTextContent('{"Github":"5.5","Google":"10.0"}');
      });
    });

    it("should handle new API response format for non-binary scorer", async () => {
      const newFormatResponse = {
        data: {
          status: "DONE",
          score: "25.0",
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
        },
      };

      vi.mocked(axios).mockResolvedValueOnce(newFormatResponse as any);

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
        expect(screen.getByTestId("threshold")).toHaveTextContent("0");
        expect(screen.getByTestId("stamp-scores")).toHaveTextContent('{"Github":"15.0","Discord":"10.0"}');
      });
    });

    it("should preserve deduplication information in stampScores", async () => {
      const responseWithDedupInfo = {
        data: {
          status: "DONE",
          score: "10.0",
          evidence: {
            rawScore: "10.0",
            threshold: "20.0",
          },
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
        },
      };

      vi.mocked(axios).mockResolvedValueOnce(responseWithDedupInfo as any);

      const TestComponent = () => {
        const context = React.useContext(ScorerContext);

        React.useEffect(() => {
          context.refreshScore(mockAddress, mockDbAccessToken);
        }, []);

        return (
          <div>
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
        const stampScores = JSON.parse(screen.getByTestId("stamp-scores").textContent || "{}");
        // Verify that deduplicated stamps have score of 0
        expect(stampScores.Google).toBe("0");
        expect(stampScores.Discord).toBe("0");
        // Verify that non-deduplicated stamps have their actual score
        expect(stampScores.Github).toBe("10.0");
      });
    });

    it("should handle stamps field being undefined", async () => {
      const responseWithoutStamps = {
        data: {
          status: "DONE",
          score: "0",
          evidence: {
            rawScore: "0",
            threshold: "10.0",
          },
        },
      };

      vi.mocked(axios).mockResolvedValueOnce(responseWithoutStamps as any);

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

    it("should handle legacy format errors", async () => {
      const legacyErrorResponse = createLegacyResponse({
        status: "ERROR",
        score: "0",
      });

      vi.mocked(axios).mockResolvedValueOnce(legacyErrorResponse as any);

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
        expect(screen.getByTestId("score-error")).toHaveTextContent("Error");
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

      const responseWithDedupScores = {
        data: {
          status: "DONE",
          score: "5.0",
          evidence: {
            rawScore: "5.0",
            threshold: "10.0",
          },
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
        },
      };

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
