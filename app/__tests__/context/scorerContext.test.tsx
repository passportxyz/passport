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
        if (config.url.includes("/weights")) {
          return Promise.resolve({ data: mockStampWeights });
        }
        return Promise.resolve(responseWithDedupScores);
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
