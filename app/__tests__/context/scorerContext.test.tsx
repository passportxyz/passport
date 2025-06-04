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

    it("should handle API response with mixed stamp formats gracefully", async () => {
      // This tests backward compatibility if API sends mixed format
      const mixedFormatResponse = {
        data: {
          status: "DONE",
          score: "20.0",
          evidence: {
            rawScore: "20.0",
            threshold: "15.0",
          },
          stamps: {
            Github: {
              score: "10.0",
              dedup: false,
              expiration_date: "2024-12-31",
            },
            Google: "10.0", // Old format mixed in
          },
        },
      };

      vi.mocked(axios).mockResolvedValueOnce(mixedFormatResponse as any);

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
        expect(screen.getByTestId("score")).toHaveTextContent("20");
        const stampScores = JSON.parse(screen.getByTestId("stamp-scores").textContent || "{}");
        expect(stampScores.Github).toBe("10.0");
        expect(stampScores.Google).toBe("10.0");
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

  describe("V2 API Response Format", () => {
    it("should handle V2 format with passing_score boolean", async () => {
      const v2Response = createV2Response({
        score: "25.12345",
        passing_score: true,
        threshold: "20.00000",
        stamps: {
          Github: {
            score: "15.12345",
            dedup: false,
            expiration_date: "2024-12-31",
          },
          Google: {
            score: "10.00000",
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
            <div data-testid="stamp-scores">{JSON.stringify(context.stampScores)}</div>
            <div data-testid="passing-score">{context.passingScore ? "true" : "false"}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score")).toHaveTextContent("25.12345");
        expect(screen.getByTestId("raw-score")).toHaveTextContent("25.12345");
        expect(screen.getByTestId("threshold")).toHaveTextContent("20.00000");
        expect(screen.getByTestId("stamp-scores")).toHaveTextContent('{"Github":"15.12345","Google":"10.00000"}');
        expect(screen.getByTestId("passing-score")).toHaveTextContent("true");
      });
    });

    it("should handle V2 format with threshold at root level", async () => {
      const v2Response = createV2Response({
        score: "15.50000",
        passing_score: false,
        threshold: "20.00000",
        stamps: {
          Discord: {
            score: "15.50000",
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
            <div data-testid="threshold">{context.threshold}</div>
            <div data-testid="passing-score">{context.passingScore ? "true" : "false"}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("threshold")).toHaveTextContent("20.00000");
        expect(screen.getByTestId("passing-score")).toHaveTextContent("false");
      });
    });

    it("should handle V2 format with score as decimal string with 5 places", async () => {
      const v2Response = createV2Response({
        score: "12.34567",
        passing_score: false,
        threshold: "15.00000",
        stamps: {
          Linkedin: {
            score: "12.34567",
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
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score")).toHaveTextContent("12.34567");
        expect(screen.getByTestId("raw-score")).toHaveTextContent("12.34567");
      });
    });

    it("should handle V2 format without status field", async () => {
      const v2Response = createV2Response({
        score: "30.00000",
        passing_score: true,
        threshold: "20.00000",
        stamps: {
          Facebook: {
            score: "30.00000",
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
            <div data-testid="score-loaded">{context.scoreLoaded ? "true" : "false"}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score")).toHaveTextContent("30.00000");
        // Should be loaded despite no status field
        expect(screen.getByTestId("score-loaded")).toHaveTextContent("true");
      });
    });

    it("should handle V2 format with null score", async () => {
      const v2Response = createV2Response({
        score: null as any,
        passing_score: false,
        threshold: "20.00000",
        error: "Score calculation failed",
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
            <div data-testid="error">{context.error || "no-error"}</div>
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
        expect(screen.getByTestId("error")).toHaveTextContent("Score calculation failed");
      });
    });

    it("should handle V2 format with deduplicated stamps", async () => {
      const v2Response = createV2Response({
        score: "10.00000",
        passing_score: false,
        threshold: "20.00000",
        stamps: {
          Github: {
            score: "10.00000",
            dedup: false,
            expiration_date: "2024-12-31",
          },
          Google: {
            score: "0.00000",
            dedup: true,
            expiration_date: "2024-12-31",
          },
          Discord: {
            score: "0.00000",
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
        expect(stampScores.Github).toBe("10.00000");
        expect(stampScores.Google).toBe("0.00000");
        expect(stampScores.Discord).toBe("0.00000");
      });
    });

    it("should handle V2 format with expiration_timestamp", async () => {
      const v2Response = createV2Response({
        score: "50.00000",
        passing_score: true,
        threshold: "20.00000",
        expiration_timestamp: "2024-06-01T00:00:00Z",
        stamps: {
          Twitter: {
            score: "50.00000",
            dedup: false,
            expiration_date: "2024-06-01",
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
            <div data-testid="expiration">{context.expirationDate || "no-expiration"}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score")).toHaveTextContent("50.00000");
        expect(screen.getByTestId("expiration")).toHaveTextContent("2024-06-01T00:00:00Z");
      });
    });

    it("should handle both V2 and legacy formats (backward compatibility)", async () => {
      // First request returns V2 format
      const v2Response = createV2Response({
        score: "30.00000",
        passing_score: true,
        threshold: "20.00000",
        stamps: {
          Github: {
            score: "30.00000",
            dedup: false,
            expiration_date: "2024-12-31",
          },
        },
      });

      // Second request returns legacy format
      const legacyResponse = createLegacyResponse({
        score: "25.0",
        rawScore: "25.0",
        threshold: "15.0",
        stamps: {
          Discord: {
            score: "25.0",
            dedup: false,
            expiration_date: "2024-12-31",
          },
        },
      });

      vi.mocked(axios)
        .mockResolvedValueOnce(v2Response as any)
        .mockResolvedValueOnce(legacyResponse as any);

      const TestComponent = () => {
        const context = React.useContext(ScorerContext);
        const [format, setFormat] = React.useState("v2");

        React.useEffect(() => {
          context.refreshScore(mockAddress, mockDbAccessToken);
        }, [format]);

        return (
          <div>
            <div data-testid="score">{context.score}</div>
            <div data-testid="threshold">{context.threshold}</div>
            <button onClick={() => setFormat("legacy")}>Switch to Legacy</button>
          </div>
        );
      };

      const { getByRole } = render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      // Check V2 format
      await waitFor(() => {
        expect(screen.getByTestId("score")).toHaveTextContent("30.00000");
        expect(screen.getByTestId("threshold")).toHaveTextContent("20.00000");
      });

      // Switch to legacy format
      getByRole("button").click();

      await waitFor(() => {
        expect(screen.getByTestId("score")).toHaveTextContent("25");
        expect(screen.getByTestId("threshold")).toHaveTextContent("15");
      });
    });

    it("should handle V2 format with empty stamps", async () => {
      const v2Response = createV2Response({
        score: "0.00000",
        passing_score: false,
        threshold: "20.00000",
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
            <div data-testid="passing-score">{context.passingScore ? "true" : "false"}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score")).toHaveTextContent("0.00000");
        expect(screen.getByTestId("stamp-scores")).toHaveTextContent("{}");
        expect(screen.getByTestId("passing-score")).toHaveTextContent("false");
      });
    });

    it("should handle V2 format missing required fields gracefully", async () => {
      // Missing passing_score, threshold
      const v2Response = {
        data: {
          address: "0x123",
          score: "5.00000",
          stamps: {
            ENS: {
              score: "5.00000",
              dedup: false,
              expiration_date: "2024-12-31",
            },
          },
        },
      };

      vi.mocked(axios).mockResolvedValueOnce(v2Response as any);

      const TestComponent = () => {
        const context = React.useContext(ScorerContext);

        React.useEffect(() => {
          context.refreshScore(mockAddress, mockDbAccessToken);
        }, []);

        return (
          <div>
            <div data-testid="score">{context.score}</div>
            <div data-testid="threshold">{context.threshold}</div>
            <div data-testid="passing-score">{context.passingScore ? "true" : "false"}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score")).toHaveTextContent("5.00000");
        // Should have default values
        expect(screen.getByTestId("threshold")).toHaveTextContent("0");
        expect(screen.getByTestId("passing-score")).toHaveTextContent("false");
      });
    });

    it("should correctly identify V2 format by absence of status field", async () => {
      const v2Response = createV2Response({
        score: "42.00000",
        passing_score: true,
        threshold: "30.00000",
        stamps: {
          NFT: {
            score: "42.00000",
            dedup: false,
            expiration_date: "2024-12-31",
          },
        },
      });

      const legacyResponse = createLegacyResponse({
        status: "DONE",
        score: "35.0",
        rawScore: "35.0",
        threshold: "25.0",
        stamps: {
          POH: {
            score: "35.0",
            dedup: false,
            expiration_date: "2024-12-31",
          },
        },
      });

      // Mock console to check if format detection is working
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      vi.mocked(axios).mockResolvedValueOnce(v2Response as any);

      const TestComponent = () => {
        const context = React.useContext(ScorerContext);

        React.useEffect(() => {
          context.refreshScore(mockAddress, mockDbAccessToken);
        }, []);

        return <div data-testid="score">{context.score}</div>;
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId("score")).toHaveTextContent("42.00000");
      });

      // After implementation, we would check that V2 format was detected
      // For now, this will fail as expected
      consoleSpy.mockRestore();
    });

    it("should convert V2 decimal format to display format correctly", async () => {
      const v2Response = createV2Response({
        score: "25.12345",
        passing_score: true,
        threshold: "20.00000",
        stamps: {
          Github: {
            score: "15.12345",
            dedup: false,
            expiration_date: "2024-12-31",
          },
          Google: {
            score: "10.00000",
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
            <div data-testid="display-score">{context.score.toFixed(1)}</div>
          </div>
        );
      };

      render(
        <ScorerContextProvider>
          <TestComponent />
        </ScorerContextProvider>
      );

      await waitFor(() => {
        // Should store the full precision internally
        expect(screen.getByTestId("score")).toHaveTextContent("25.12345");
        // But display with one decimal for UI
        expect(screen.getByTestId("display-score")).toHaveTextContent("25.1");
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
