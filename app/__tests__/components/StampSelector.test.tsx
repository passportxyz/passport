import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { useCustomization } from "../../hooks/useCustomization";
import { platforms } from "@gitcoin/passport-platforms";
import { StampSelector } from "../../components/StampSelector";

// mock useCustomization
jest.mock("../../hooks/useCustomization");

const GtcStaking = platforms.GtcStaking;

describe("<StampSelector />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("exclusion tests", () => {
    const renderTestComponent = (customization: any) => {
      (useCustomization as jest.Mock).mockReturnValue(customization);
      const queryClient = new QueryClient();
      render(
        <QueryClientProvider client={queryClient}>
          <StampSelector
            currentPlatform={GtcStaking.PlatformDetails}
            currentProviders={GtcStaking.ProviderConfig}
            selectedProviders={[] as PROVIDER_ID[]}
            verifiedProviders={[] as PROVIDER_ID[]}
            setSelectedProviders={() => {}}
          />
        </QueryClientProvider>
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
      expect(screen.queryByTestId("checkbox-SelfStakingBronze")).toBeInTheDocument();
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
      expect(screen.queryByTestId("checkbox-SelfStakingBronze")).toBeInTheDocument();
      expect(screen.queryByText("Self GTC Staking")).toBeInTheDocument();

      expect(screen.queryByTestId("checkbox-CommunityStakingBronze")).not.toBeInTheDocument();
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
      expect(screen.queryByTestId("checkbox-SelfStakingBronze")).not.toBeInTheDocument();
      expect(screen.queryByText("Self GTC Staking")).not.toBeInTheDocument();
    });

    it("include platform if customization doesn't specify custom weights", () => {
      renderTestComponent({});
      expect(screen.queryByTestId("checkbox-SelfStakingBronze")).toBeInTheDocument();
      expect(screen.queryByText("Self GTC Staking")).toBeInTheDocument();
    });
  });
});
