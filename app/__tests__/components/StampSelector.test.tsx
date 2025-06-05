import { vi, describe, it, expect, Mock } from "vitest";
import { screen } from "@testing-library/react";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { useCustomization } from "../../hooks/useCustomization";
import { platforms } from "@gitcoin/passport-platforms";
import { StampSelector } from "../../components/StampSelector";
import { makeTestCeramicContext, renderWithContext } from "../../__test-fixtures__/contextTestHelpers";

// mock useCustomization
vi.mock("../../hooks/useCustomization");

const GtcStaking = platforms.GtcStaking;

const testCeramicContext = makeTestCeramicContext();

describe("<StampSelector />", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exclusion tests", () => {
    const renderTestComponent = (customization: any, stampScores = {}) => {
      (useCustomization as Mock).mockReturnValue(customization);
      renderWithContext(
        testCeramicContext,
        <StampSelector currentProviders={GtcStaking.ProviderConfig} verifiedProviders={[] as PROVIDER_ID[]} />,
        undefined,
        {
          stampScores: {
            SelfStakingBronze: "1",
            SelfStakingSilver: "1",
            SelfStakingGold: "1",
            BeginnerCommunityStaker: "1",
            ExperiencedCommunityStaker: "1",
            TrustedCitizen: "1",
            ...stampScores,
          },
        }
      );
    };

    it("include platform if any stamps included", () => {
      renderTestComponent({
        useCustomDashboard: true,
        dashboardPanel: {},
        scorer: {
          weights: {
            SelfStakingBronze: "1",
            SelfStakingSilver: "1",
            SelfStakingGold: "1",
            BeginnerCommunityStaker: "1",
            ExperiencedCommunityStaker: "1",
            TrustedCitizen: "1",
          },
        },
      });

      expect(screen.queryByText("Self GTC Staking")).toBeInTheDocument();
      expect(screen.queryByText("Community GTC Staking")).toBeInTheDocument();
    });

    it("exclude full groups correctly", () => {
      renderTestComponent({
        useCustomDashboard: true,
        dashboardPanel: {},
        scorer: {
          weights: {
            SelfStakingBronze: "1",
            SelfStakingSilver: "1",
            SelfStakingGold: "1",
          },
        },
      });
      expect(screen.queryByText("Self GTC Staking")).toBeInTheDocument();

      expect(screen.queryByText("Community GTC Staking")).not.toBeInTheDocument();
    });

    it("exclude platform if no stamps included", () => {
      renderTestComponent({
        useCustomDashboard: true,
        dashboardPanel: {},
        scorer: {
          weights: {
            ADifferentStamp: 1,
          },
        },
      });
      expect(screen.queryByTestId("indicator-SelfStakingBronze")).not.toBeInTheDocument();
      expect(screen.queryByText("Self GTC Staking")).not.toBeInTheDocument();
    });

    it("should hide deprecated stamps with zero score", () => {
      const customization = {
        useCustomDashboard: true,
        dashboardPanel: {},
        scorer: {
          weights: {
            SelfStakingBronze: "1",
            SelfStakingSilver: "1",
          },
        },
      };

      // Mock a deprecated provider
      const originalProviders = GtcStaking.ProviderConfig[0].providers;
      GtcStaking.ProviderConfig[0].providers = [
        { ...originalProviders[0], isDeprecated: true, name: "SelfStakingBronze" },
        { ...originalProviders[1], isDeprecated: false, name: "SelfStakingSilver" },
      ];

      renderTestComponent(customization, {
        SelfStakingBronze: "0",
        SelfStakingSilver: "1",
      });

      // The group header should be present
      expect(screen.queryByText("Self GTC Staking")).toBeInTheDocument();
      expect(screen.queryByTestId("indicator-SelfStakingBronze")).not.toBeInTheDocument();
      expect(screen.queryByTestId("indicator-SelfStakingSilver")).toBeInTheDocument();

      // Restore original providers
      GtcStaking.ProviderConfig[0].providers = originalProviders;
    });

    it("should hide group when all stamps are deprecated with zero scores", () => {
      const customization = {
        useCustomDashboard: true,
        dashboardPanel: {},
        scorer: {
          weights: {
            SelfStakingBronze: "1",
            SelfStakingSilver: "1",
          },
        },
      };

      // Mock all providers in a group as deprecated
      const originalProviders = GtcStaking.ProviderConfig[0].providers;
      GtcStaking.ProviderConfig[0].providers = [
        { ...originalProviders[0], isDeprecated: true, name: "SelfStakingBronze" },
        { ...originalProviders[1], isDeprecated: true, name: "SelfStakingSilver" },
      ];

      renderTestComponent(customization, {
        SelfStakingBronze: "0",
        SelfStakingSilver: "0",
      });

      // The group header should not be present
      expect(screen.queryByText("Self GTC Staking")).not.toBeInTheDocument();
      expect(screen.queryByTestId("indicator-SelfStakingBronze")).not.toBeInTheDocument();
      expect(screen.queryByTestId("indicator-SelfStakingSilver")).not.toBeInTheDocument();

      // Restore original providers
      GtcStaking.ProviderConfig[0].providers = originalProviders;
    });

    it("should show deprecated stamps with non-zero score", () => {
      const customization = {
        useCustomDashboard: true,
        dashboardPanel: {},
        scorer: {
          weights: {
            SelfStakingBronze: "1",
            SelfStakingSilver: "1",
          },
        },
      };

      // Mock a deprecated provider
      const originalProviders = GtcStaking.ProviderConfig[0].providers;
      GtcStaking.ProviderConfig[0].providers = [
        { ...originalProviders[0], isDeprecated: true, name: "SelfStakingBronze" },
        { ...originalProviders[1], isDeprecated: false, name: "SelfStakingSilver" },
      ];

      renderTestComponent(customization, {
        SelfStakingBronze: "1",
        SelfStakingSilver: "1",
      });

      expect(screen.queryByTestId("indicator-SelfStakingBronze")).toBeInTheDocument();
      expect(screen.queryByTestId("indicator-SelfStakingSilver")).toBeInTheDocument();

      // Restore original providers
      GtcStaking.ProviderConfig[0].providers = originalProviders;
    });

    it("include platform if customization doesn't specify custom weights", () => {
      renderTestComponent({});
      expect(screen.queryByText("Self GTC Staking")).toBeInTheDocument();
    });
  });

  describe("deduplication links", () => {
    it("should make 'Claimed by another wallet' text clickable link to support docs", () => {
      const customization = {
        useCustomDashboard: true,
        dashboardPanel: {},
        scorer: {
          weights: {
            SelfStakingBronze: "1",
          },
        },
      };

      // Create a mock context with verified but deduplicated stamp
      const mockCeramicContextWithDedup = {
        ...testCeramicContext,
        allProvidersState: {
          SelfStakingBronze: {
            stamp: {
              credential: {
                credentialSubject: {
                  provider: "SelfStakingBronze",
                },
              },
            },
          },
        },
      };

      (useCustomization as Mock).mockReturnValue(customization);
      renderWithContext(
        mockCeramicContextWithDedup,
        <StampSelector
          currentProviders={GtcStaking.ProviderConfig}
          verifiedProviders={["SelfStakingBronze"] as PROVIDER_ID[]}
        />,
        undefined,
        {
          stampScores: {
            SelfStakingBronze: "0", // 0 score indicates deduplication
          },
          stampDedupStatus: {
            SelfStakingBronze: true, // Explicitly mark as deduplicated
          },
        }
      );

      // Find the "Claimed by another wallet" text
      const claimedText = screen.getByText("Claimed by another wallet");
      expect(claimedText).toBeInTheDocument();

      // Test that it's wrapped in a clickable link
      const dedupLink = claimedText.closest("a");
      expect(dedupLink).toHaveAttribute(
        "href",
        "https://support.passport.xyz/passport-knowledge-base/common-questions/why-am-i-receiving-zero-points-for-a-verified-stamp"
      );
      expect(dedupLink).toHaveAttribute("target", "_blank");
      expect(dedupLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });
});
