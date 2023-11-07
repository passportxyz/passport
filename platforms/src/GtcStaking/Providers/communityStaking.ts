import { GtcStakingProvider, GtcStakingProviderOptions } from "./GtcStaking";

class CommunityStakingBaseProvider extends GtcStakingProvider {
  constructor(options: Omit<GtcStakingProviderOptions, "dataKey">) {
    super({
      ...options,
      dataKey: "communityStakes",
    });
  }
}
export class BeginnerCommunityStakerProvider extends CommunityStakingBaseProvider {
  constructor() {
    super({
      type: "BeginnerCommunityStaker",
      identifier: "bcs1gte5",
      communityTypeCount: 1,
    });
  }
}

export class ExperiencedCommunityStakerProvider extends CommunityStakingBaseProvider {
  constructor() {
    super({
      type: "ExperiencedCommunityStaker",
      identifier: "ecs2gte10",
      communityTypeCount: 2,
    });
  }
}

export class TrustedCitizenProvider extends CommunityStakingBaseProvider {
  constructor() {
    super({
      type: "TrustedCitizen",
      identifier: "tc5gte20",
      communityTypeCount: 5,
    });
  }
}
