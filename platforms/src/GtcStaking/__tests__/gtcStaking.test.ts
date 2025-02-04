import { BigNumber } from "bignumber.js";
import { GtcStakingProvider } from "../Providers/GtcStaking.js";

describe("GtcStakingProvider", () => {
  beforeAll(() => {
    process.env.GTC_STAKING_ROUNDS =
      // eslint-disable-next-line prettier/prettier, quotes
      '[{"id": 4, "start": 1693526400, "duration": 7592340}, {"id": 5, "start": 1701118741, "duration": 8157658}]';
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });
  it("should get round 4 based on timestamp", () => {
    jest.spyOn(Date, "now").mockImplementation(() => new Date("2023-11-15T00:00:00Z").getTime());
    const provider = new GtcStakingProvider({ type: "SelfStakingBronze", thresholdAmount: new BigNumber(5) });

    const round = provider.getCurrentRound();
    expect(round).toEqual(4);
  });
  it("should get round 5 based on timestamp", () => {
    jest.spyOn(Date, "now").mockImplementation(() => new Date("2023-11-28T00:00:00Z").getTime());
    const provider = new GtcStakingProvider({ type: "SelfStakingBronze", thresholdAmount: new BigNumber(5) });

    const round = provider.getCurrentRound();
    expect(round).toEqual(5);
  });
});
