import React from "react";
import { screen, render } from "@testing-library/react";
import { getPlatformSpec } from "../../config/platforms";
import { PlatformCard, SelectedProviders } from "../../components/PlatformCard";
import { PlatformSpec } from "@gitcoin/passport-platforms/*";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { useCustomization } from "../../hooks/useCustomization";

// mock useCustomization
jest.mock("../../hooks/useCustomization", () => ({
  useCustomization: jest.fn(),
}));

describe("<PlatformCard />", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("exclusion tests", () => {
    const renderTestComponent = (customization: any) => {
      (useCustomization as jest.Mock).mockReturnValue(customization);
      const GtcStakingPlatform = getPlatformSpec("GtcStaking") as PlatformSpec;
      const platformScoreSpec = {
        ...GtcStakingPlatform,
        possiblePoints: 6,
        earnedPoints: 0,
      };
      render(
        <PlatformCard
          i={0}
          platform={platformScoreSpec}
          selectedProviders={{ GtcStaking: [] as PROVIDER_ID[] } as SelectedProviders}
          onOpen={() => {}}
          setCurrentPlatform={() => {}}
        />
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
      expect(screen.queryByTestId("platform-name")).toBeInTheDocument();
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
      expect(screen.queryByTestId("platform-name")).not.toBeInTheDocument();
    });

    it("include platform if customization doesn't specify custom weights", () => {
      renderTestComponent({});
      expect(screen.queryByTestId("platform-name")).toBeInTheDocument();
    });
    it("should show allow list stamp if user has points", () => {
      (useCustomization as jest.Mock).mockReturnValue({
        scorer: {
          wieghts: {
            "AllowList#test": 10,
          },
        },
      });
      const AllowListPlatform = getPlatformSpec("AllowList") as PlatformSpec;
      const platformScoreSpec = {
        ...AllowListPlatform,
        possiblePoints: 6,
        earnedPoints: 1,
      };
      render(<PlatformCard i={0} platform={platformScoreSpec} onOpen={() => {}} setCurrentPlatform={() => {}} />);
      expect(screen.getByTestId("platform-name")).toBeInTheDocument();
    });
    it("should hide allow list if no points are earned", () => {
      (useCustomization as jest.Mock).mockReturnValue({
        scorer: {
          wieghts: {
            "AllowList#test": 10,
          },
        },
      });
      const AllowListPlatform = getPlatformSpec("AllowList") as PlatformSpec;
      const platformScoreSpec = {
        ...AllowListPlatform,
        possiblePoints: 6,
        earnedPoints: 0,
      };
      render(<PlatformCard i={0} platform={platformScoreSpec} onOpen={() => {}} setCurrentPlatform={() => {}} />);
      expect(screen.queryByTestId("platform-name")).not.toBeInTheDocument();
    });
  });
});
