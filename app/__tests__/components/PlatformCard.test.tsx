import { vi, describe, it, expect, beforeEach } from "vitest";
import React from "react";
import { screen, render } from "@testing-library/react";
import { PlatformCard } from "../../components/PlatformCard";
import { CeramicContext, CeramicContextState } from "../../context/ceramicContext";
import { ScorerContext, ScorerContextState } from "../../context/scorerContext";
import { makeTestCeramicContext } from "../../__test-fixtures__/contextTestHelpers";
import { PLATFORM_ID } from "@gitcoin/passport-types";
import { usePlatforms } from "../../hooks/usePlatforms";

vi.mock("../../hooks/usePlatforms");

describe("<PlatformCard />", () => {
  const mockSetCurrentPlatform = vi.fn();
  const mockOnOpen = vi.fn();

  const mockUsePlatforms = {
    platformSpecs: [],
    platformProviderIds: {},
  };

  const defaultPlatform = {
    platform: "Github" as PLATFORM_ID,
    name: "Github",
    description: "Github platform",
    connectMessage: "Connect",
    icon: "./assets/githubStampIcon.svg",
    possiblePoints: 10,
    displayPossiblePoints: 10,
    earnedPoints: 0,
  };

  const mockCeramicContext: CeramicContextState = makeTestCeramicContext();

  const mockScorerContext: Partial<ScorerContextState> = {
    stampScores: {},
    stampWeights: {},
    stampDedupStatus: {},
  };

  const createMockUsePlatforms = (providerIds: string[] = ["GithubContributor"]) => ({
    ...mockUsePlatforms,
    platformSpecs: [
      {
        platform: "Github" as PLATFORM_ID,
        name: "Github",
        description: "Github platform",
        connectMessage: "Connect",
        icon: "./assets/githubStampIcon.svg",
      },
    ],
    platformProviderIds: {
      Github: providerIds,
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(usePlatforms).mockReturnValue(mockUsePlatforms as any);
  });

  describe("Deduplication Label Display", () => {
    // TODO #3502: unskip once designs are clear
    it.skip("should display deduplication label when stamp is verified but has 0 points due to deduplication", () => {
      // Mock a verified stamp (has credential) but with 0 earned points
      const ceramicContextWithDedupStamp = {
        ...mockCeramicContext,
        allProvidersState: {
          GithubContributor: {
            stamp: {
              credential: {
                credentialSubject: {
                  provider: "GithubContributor",
                },
              },
            },
          },
        },
      };

      const scorerContextWithDedup: Partial<ScorerContextState> = {
        stampScores: {
          GithubContributor: "0", // 0 score indicates deduplication
        },
        stampWeights: {
          GithubContributor: "5.0",
        },
        stampDedupStatus: {
          GithubContributor: true, // Mark as deduplicated
        },
      };

      // Platform has providers verified but 0 earned points
      const dedupPlatform = {
        ...defaultPlatform,
        earnedPoints: 0,
      };

      vi.mocked(usePlatforms).mockReturnValue(createMockUsePlatforms() as any);

      const mockOnOpen = vi.fn();
      const mockSetCurrentPlatform = vi.fn();

      render(
        <CeramicContext.Provider value={ceramicContextWithDedupStamp}>
          <ScorerContext.Provider value={scorerContextWithDedup as ScorerContextState}>
            <PlatformCard
              i={0}
              platform={dedupPlatform}
              onOpen={mockOnOpen}
              setCurrentPlatform={mockSetCurrentPlatform}
            />
          </ScorerContext.Provider>
        </CeramicContext.Provider>
      );

      // Test that deduplication badge is clickable link to support docs
      const dedupLink = screen.getByTestId("deduped-label").closest("a");
      expect(dedupLink).toHaveAttribute(
        "href",
        "https://support.passport.xyz/passport-knowledge-base/common-questions/why-am-i-receiving-zero-points-for-a-verified-stamp"
      );
      expect(dedupLink).toHaveAttribute("target", "_blank");
      expect(dedupLink).toHaveAttribute("rel", "noopener noreferrer");
      expect(screen.getByTestId("deduped-label")).toHaveTextContent("Deduplicated");
      expect(screen.getByTestId("verified-label")).toBeInTheDocument(); // Both labels should be present
      expect(screen.queryByTestId("connect-button")).not.toBeInTheDocument();
    });

    it("should not display deduplication label for unverified stamps", () => {
      render(
        <CeramicContext.Provider value={mockCeramicContext}>
          <ScorerContext.Provider value={mockScorerContext as ScorerContextState}>
            <PlatformCard
              i={0}
              platform={defaultPlatform}
              onOpen={mockOnOpen}
              setCurrentPlatform={mockSetCurrentPlatform}
            />
          </ScorerContext.Provider>
        </CeramicContext.Provider>
      );

      expect(screen.queryByTestId("deduped-label")).not.toBeInTheDocument();
      expect(screen.getByTestId("connect-button")).toBeInTheDocument();
    });

    // TODO #3502: unskip when designs are clear
    it.skip("should not display deduplication label for verified stamps with earned points", () => {
      const ceramicContextWithVerifiedStamp = {
        ...mockCeramicContext,
        allProvidersState: {
          GithubContributor: {
            stamp: {
              credential: {
                credentialSubject: {
                  provider: "GithubContributor",
                },
              },
            },
          },
        },
      };

      const verifiedPlatform = {
        ...defaultPlatform,
        earnedPoints: 5, // Has earned points
      };

      vi.mocked(usePlatforms).mockReturnValue(createMockUsePlatforms() as any);

      render(
        <CeramicContext.Provider value={ceramicContextWithVerifiedStamp}>
          <ScorerContext.Provider value={mockScorerContext as ScorerContextState}>
            <PlatformCard
              i={0}
              platform={verifiedPlatform}
              onOpen={mockOnOpen}
              setCurrentPlatform={mockSetCurrentPlatform}
            />
          </ScorerContext.Provider>
        </CeramicContext.Provider>
      );

      expect(screen.queryByTestId("deduped-label")).not.toBeInTheDocument();
      expect(screen.getByTestId("verified-label")).toBeInTheDocument();
    });

    // TODO #3502: unskip when designs are clear
    it.skip("should handle multiple providers where some are deduplicated", () => {
      const ceramicContextWithMixedStamps = {
        ...mockCeramicContext,
        allProvidersState: {
          GithubContributor: {
            stamp: {
              credential: {
                credentialSubject: {
                  provider: "GithubContributor",
                },
              },
            },
          },
          GithubFollower: {
            stamp: {
              credential: {
                credentialSubject: {
                  provider: "GithubFollower",
                },
              },
            },
          },
        },
      };

      const scorerContextWithMixedScores: Partial<ScorerContextState> = {
        stampScores: {
          GithubContributor: "5.0", // Has score
          GithubFollower: "0", // Deduplicated
        },
        stampWeights: {
          GithubContributor: "5.0",
          GithubFollower: "3.0",
        },
      };

      const mixedPlatform = {
        ...defaultPlatform,
        earnedPoints: 5, // Only partial points earned
        possiblePoints: 8,
      };

      vi.mocked(usePlatforms).mockReturnValue(createMockUsePlatforms(["GithubContributor", "GithubFollower"]) as any);

      render(
        <CeramicContext.Provider value={ceramicContextWithMixedStamps}>
          <ScorerContext.Provider value={scorerContextWithMixedScores as ScorerContextState}>
            <PlatformCard
              i={0}
              platform={mixedPlatform}
              onOpen={mockOnOpen}
              setCurrentPlatform={mockSetCurrentPlatform}
            />
          </ScorerContext.Provider>
        </CeramicContext.Provider>
      );

      // Should show as verified since some stamps have points
      expect(screen.getByTestId("verified-label")).toBeInTheDocument();
      expect(screen.queryByTestId("deduped-label")).not.toBeInTheDocument();
    });

    // TODO #3502: unskip when designs are clear
    it.skip("should display deduplication label when all verified stamps are deduplicated", () => {
      const ceramicContextWithAllDedup = {
        ...mockCeramicContext,
        allProvidersState: {
          GithubContributor: {
            stamp: {
              credential: {
                credentialSubject: {
                  provider: "GithubContributor",
                },
              },
            },
          },
          GithubFollower: {
            stamp: {
              credential: {
                credentialSubject: {
                  provider: "GithubFollower",
                },
              },
            },
          },
        },
      };

      const scorerContextAllDedup: Partial<ScorerContextState> = {
        stampScores: {
          GithubContributor: "0", // Deduplicated
          GithubFollower: "0", // Deduplicated
        },
        stampWeights: {
          GithubContributor: "5.0",
          GithubFollower: "3.0",
        },
        stampDedupStatus: {
          GithubContributor: true,
          GithubFollower: true,
        },
      };

      const allDedupPlatform = {
        ...defaultPlatform,
        earnedPoints: 0, // No points earned due to deduplication
        possiblePoints: 8,
      };

      vi.mocked(usePlatforms).mockReturnValue(createMockUsePlatforms(["GithubContributor", "GithubFollower"]) as any);

      const mockOnOpen = vi.fn();
      const mockSetCurrentPlatform = vi.fn();

      render(
        <CeramicContext.Provider value={ceramicContextWithAllDedup}>
          <ScorerContext.Provider value={scorerContextAllDedup as ScorerContextState}>
            <PlatformCard
              i={0}
              platform={allDedupPlatform}
              onOpen={mockOnOpen}
              setCurrentPlatform={mockSetCurrentPlatform}
            />
          </ScorerContext.Provider>
        </CeramicContext.Provider>
      );

      // Test that deduplication badge is clickable link to support docs
      const dedupLink = screen.getByTestId("deduped-label").closest("a");
      expect(dedupLink).toHaveAttribute(
        "href",
        "https://support.passport.xyz/passport-knowledge-base/common-questions/why-am-i-receiving-zero-points-for-a-verified-stamp"
      );
      expect(dedupLink).toHaveAttribute("target", "_blank");
      expect(dedupLink).toHaveAttribute("rel", "noopener noreferrer");
      expect(screen.getByTestId("deduped-label")).toHaveTextContent("Deduplicated");
    });
  });

  describe("Expired Stamp Behavior", () => {
    it("should not show deduplication label for expired stamps even if deduplicated", () => {
      const ceramicContextWithExpired = {
        ...mockCeramicContext,
        expiredPlatforms: {
          Github: true,
        },
        allProvidersState: {
          GithubContributor: {
            stamp: {
              credential: {
                credentialSubject: {
                  provider: "GithubContributor",
                },
              },
            },
          },
        },
      };

      const expiredPlatform = {
        ...defaultPlatform,
        earnedPoints: 0, // No points, but expired takes precedence
      };

      vi.mocked(usePlatforms).mockReturnValue({
        ...mockUsePlatforms,
        platformSpecs: [
          {
            platform: "Github" as PLATFORM_ID,
            name: "Github",
            description: "Github platform",
            connectMessage: "Connect",
            icon: "./assets/githubStampIcon.svg",
          },
        ],
        platformProviderIds: {
          Github: ["GithubContributor"],
        },
      } as any);

      render(
        <CeramicContext.Provider value={ceramicContextWithExpired}>
          <ScorerContext.Provider value={mockScorerContext as ScorerContextState}>
            <PlatformCard
              i={0}
              platform={expiredPlatform}
              onOpen={mockOnOpen}
              setCurrentPlatform={mockSetCurrentPlatform}
            />
          </ScorerContext.Provider>
        </CeramicContext.Provider>
      );

      expect(screen.getByTestId("expired-label")).toBeInTheDocument();
      expect(screen.queryByTestId("deduped-label")).not.toBeInTheDocument();
    });
  });
});
