import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import BigNumber from "bignumber.js";
import { GtcStakingContext, GtcStakingProvider, GtcStakingProviderOptions } from "./GtcStaking";

class SelfStakingBaseProvider extends GtcStakingProvider {
  constructor(options: GtcStakingProviderOptions) {
    super(options);
  }

  async verify(payload: RequestPayload, context: GtcStakingContext): Promise<VerifiedPayload> {
    const address = this.getAddress(payload);
    const stakeData = await this.getStakes(payload, context);
    const selfStakeAmount = stakeData.selfStake;

    if (selfStakeAmount.gte(this.thresholdAmount)) {
      return {
        valid: true,
        record: { address },
      };
    } else {
      return {
        valid: false,
        errors: [
          `Your current GTC self staking amount is ${selfStakeAmount.toString()} GTC, which is below the required ${this.thresholdAmount.toString()} GTC for this stamp.`,
        ],
      };
    }
  }
}

export class SelfStakingBronzeProvider extends SelfStakingBaseProvider {
  constructor() {
    super({
      type: "SelfStakingBronze",
      thresholdAmount: new BigNumber(5),
    });
  }
}

export class SelfStakingSilverProvider extends SelfStakingBaseProvider {
  constructor() {
    super({
      type: "SelfStakingSilver",
      thresholdAmount: new BigNumber(20),
    });
  }
}

export class SelfStakingGoldProvider extends SelfStakingBaseProvider {
  constructor() {
    super({
      type: "SelfStakingGold",
      thresholdAmount: new BigNumber(125),
    });
  }
}
