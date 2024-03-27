import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import BigNumber from "bignumber.js";
import { GtcStakingContext, GtcStakingProvider, GtcStakingProviderOptions, Stake, StakeV2 } from "./GtcStaking";

class CommunityStakingBaseProvider extends GtcStakingProvider {
  minimumCountCommunityStakes: number;

  constructor(options: GtcStakingProviderOptions & { minimumCountCommunityStakes: number }) {
    super(options);
    this.minimumCountCommunityStakes = options.minimumCountCommunityStakes;
  }

  async verify(payload: RequestPayload, context: GtcStakingContext): Promise<VerifiedPayload> {
    const address = this.getAddress(payload);
    const stakeData = await this.getStakes(payload, context);
    const communityStakes = stakeData.communityStakes;
    const communityStakesV2 = stakeData.communityStakesV2;

    const countRelevantStakes = this.getCountRelevantStakes(communityStakes, address);
    const countRelevantStakesV2 = this.getCountRelevantStakesV2(communityStakesV2, address);
    const totalCountRelevantStakes = countRelevantStakes + countRelevantStakesV2;
    if (totalCountRelevantStakes >= this.minimumCountCommunityStakes) {
      return {
        valid: true,
        record: { address },
      };
    } else {
      return {
        valid: false,
        errors: [
          `There are currently ${totalCountRelevantStakes} community stakes of at least ${this.thresholdAmount.toString()} GTC on/by your address, ` +
            `you need a minimum of ${this.minimumCountCommunityStakes} relevant community stakes to claim this stamp`,
        ],
      };
    }
  }

  getCountRelevantStakes(communityStakes: Stake[], address: string): number {
    const stakesOnAddressByOthers: Record<string, BigNumber> = {};
    const stakesByAddressOnOthers: Record<string, BigNumber> = {};

    for (let i = 0; i < communityStakes.length; i++) {
      const stake = communityStakes[i];
      const stakeAmount = new BigNumber(stake.amount);

      if (stake.staker === address && stake.address !== address) {
        stakesByAddressOnOthers[stake.address] ||= new BigNumber(0);
        if (stake.staked) {
          stakesByAddressOnOthers[stake.address] = stakesByAddressOnOthers[stake.address].plus(stakeAmount);
        } else {
          stakesByAddressOnOthers[stake.address] = stakesByAddressOnOthers[stake.address].sub(stakeAmount);
        }
      } else if (stake.address === address && stake.staker !== address) {
        stakesOnAddressByOthers[stake.staker] ||= new BigNumber(0);
        if (stake.staked) {
          stakesOnAddressByOthers[stake.staker] = stakesOnAddressByOthers[stake.staker].plus(stakeAmount);
        } else {
          stakesOnAddressByOthers[stake.staker] = stakesOnAddressByOthers[stake.staker].sub(stakeAmount);
        }
      }
    }

    return [...Object.entries(stakesByAddressOnOthers), ...Object.entries(stakesOnAddressByOthers)].reduce(
      (count, [_address, amount]) => {
        if (amount.gte(this.thresholdAmount)) {
          return count + 1;
        }
        return count;
      },
      0
    );
  }

  getCountRelevantStakesV2(communityStakes: StakeV2[], address: string): number {
    const stakesOnAddressByOthers: Record<string, BigNumber> = {};
    const stakesByAddressOnOthers: Record<string, BigNumber> = {};

    for (let i = 0; i < communityStakes.length; i++) {
      const stake = communityStakes[i];
      const stakeAmount = new BigNumber(stake.amount);

      if (stake.staker === address && stake.stakee !== address) {
        stakesByAddressOnOthers[stake.stakee] ||= new BigNumber(0);
        if (new Date(stake.unlock_time) > new Date()) {
          stakesByAddressOnOthers[stake.stakee] = stakesByAddressOnOthers[stake.stakee].plus(stakeAmount);
        }
      } else if (stake.stakee === address && stake.staker !== address) {
        stakesOnAddressByOthers[stake.staker] ||= new BigNumber(0);
        if (new Date(stake.unlock_time) > new Date()) {
          stakesOnAddressByOthers[stake.staker] = stakesOnAddressByOthers[stake.staker].plus(stakeAmount);
        }
      }
    }

    return [...Object.entries(stakesByAddressOnOthers), ...Object.entries(stakesOnAddressByOthers)].reduce(
      (count, [_address, amount]) => {
        if (amount.gte(this.thresholdAmount)) {
          return count + 1;
        }
        return count;
      },
      0
    );
  }
}

export class BeginnerCommunityStakerProvider extends CommunityStakingBaseProvider {
  constructor() {
    super({
      type: "BeginnerCommunityStaker",
      thresholdAmount: new BigNumber(5),
      minimumCountCommunityStakes: 1,
    });
  }
}

export class ExperiencedCommunityStakerProvider extends CommunityStakingBaseProvider {
  constructor() {
    super({
      type: "ExperiencedCommunityStaker",
      thresholdAmount: new BigNumber(10),
      minimumCountCommunityStakes: 2,
    });
  }
}

export class TrustedCitizenProvider extends CommunityStakingBaseProvider {
  constructor() {
    super({
      type: "TrustedCitizen",
      thresholdAmount: new BigNumber(20),
      minimumCountCommunityStakes: 5,
    });
  }
}
