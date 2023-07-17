import { GtcStakingProvider, GtcStakingProviderOptions } from "./GtcStaking";
import { parseUnits } from "ethers/lib/utils";

class SelfStakingBaseProvider extends GtcStakingProvider {
  constructor(options: Omit<GtcStakingProviderOptions, "dataKey">) {
    super({
      ...options,
      dataKey: "selfStake",
    });
  }
}

export class SelfStakingBronzeProvider extends SelfStakingBaseProvider {
  constructor() {
    super({
      type: "SelfStakingBronze",
      weiThreshold: parseUnits("5", 18),
      identifier: "ssgte5",
    });
  }
}

export class SelfStakingSilverProvider extends SelfStakingBaseProvider {
  constructor() {
    super({
      type: "SelfStakingSilver",
      weiThreshold: parseUnits("20", 18),
      identifier: "ssgte20",
    });
  }
}

export class SelfStakingGoldProvider extends SelfStakingBaseProvider {
  constructor() {
    super({
      type: "SelfStakingGold",
      weiThreshold: parseUnits("125", 18),
      identifier: "ssgte125",
    });
  }
}
