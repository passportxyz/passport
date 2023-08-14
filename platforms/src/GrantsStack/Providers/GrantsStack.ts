import type { Provider, ProviderOptions } from "../../types";
import { ProviderContext, PROVIDER_ID, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import axios from "axios";

export type GrantsStackProviderOptions = ProviderOptions & {
  type: PROVIDER_ID;
  threshold: number;
};

export type GrantsStackContext = ProviderContext & {
  grantsStack?: {
    projectCount?: number;
    programCount?: number;
  };
};

type StatisticResponse = {
  num_grants_contribute_to: number;
  num_rounds_contribute_to: number;
  total_contribution_amount: number;
  num_gr14_contributions: number;
};

export const getGrantsStackData = async (
  payload: RequestPayload,
  context: GrantsStackContext
): Promise<GrantsStackContext> => {
  try {
    if (!context?.grantsStack?.projectCount || !context?.grantsStack?.programCount) {
      const grantStatisticsRequest: {
        data: StatisticResponse;
      } = await axios.get(`${process.env.CGRANTS_API_URL}/allo/contributor_statistics`, {
        headers: { Authorization: process.env.CGRANTS_API_TOKEN },
        params: { address: payload.address },
      });

      if (!context.grantsStack) context.grantsStack = {};

      context.grantsStack.projectCount = grantStatisticsRequest.data.num_grants_contribute_to;
      context.grantsStack.programCount = grantStatisticsRequest.data.num_rounds_contribute_to;

      return context.grantsStack;
    }
    return context.grantsStack;
  } catch (e) {
    throw new Error("Error getting GrantsStack data");
  }
};

export class GrantsStackProvider implements Provider {
  type: PROVIDER_ID;
  threshold: number;

  constructor(options: GrantsStackProviderOptions) {
    this.type = options.type;
    this.threshold = options.threshold;
  }

  async verify(payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    try {
      const grantsStackData = await getGrantsStackData(payload, context);
      const valid = grantsStackData.projectCount >= this.threshold;

      const contributionStatistic = `${this.type}-${this.threshold}-contribution-statistic`;
      return {
        valid,
        record: {
          address: payload.address,
          contributionStatistic,
        },
      };
    } catch (e) {
      throw new Error("Error verifying GrantsStack data");
    }
  }
}
