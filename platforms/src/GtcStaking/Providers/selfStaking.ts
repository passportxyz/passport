import { GtcStakingProvider, GtcStakingProviderOptions } from "./GtcStaking";

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
      threshold: 5,
      identifier: "ssgte5",
    });
  }
}

export class SelfStakingSilverProvider extends SelfStakingBaseProvider {
  constructor() {
    super({
      type: "SelfStakingSilver",
      threshold: 20,
      identifier: "ssgte20",
    });
  }
}

export class SelfStakingGoldProvider extends SelfStakingBaseProvider {
  constructor() {
    super({
      type: "SelfStakingGold",
      threshold: 125,
      identifier: "ssgte125",
    });
  }
}
