import { GtcStakingProvider, GtcStakingProviderOptions } from "./GtcStaking";
import { parseUnits } from "ethers/lib/utils";

class CommunityStakingBaseProvider extends GtcStakingProvider {
  constructor(options: Omit<GtcStakingProviderOptions, "dataKey">) {
    super({
      ...options,
      dataKey: "communityStake",
    });
  }
}
export class CommunityStakingBronzeProvider extends CommunityStakingBaseProvider {
  constructor() {
    super({
      type: "CommunityStakingBronze",
      weiThreshold: parseUnits("5", 18),
      identifier: "csgte5",
    });
  }
}

export class CommunityStakingSilverProvider extends CommunityStakingBaseProvider {
  constructor() {
    super({
      type: "CommunityStakingSilver",
      weiThreshold: parseUnits("20", 18),
      identifier: "csgte20",
    });
  }
}

export class CommunityStakingGoldProvider extends CommunityStakingBaseProvider {
  constructor() {
    super({
      type: "CommunityStakingGold",
      weiThreshold: parseUnits("125", 18),
      identifier: "csgte125",
    });
  }
}
