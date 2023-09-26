import { ProviderExternalVerificationError, type Provider, type ProviderOptions } from "../../types";
import { ProviderContext, PROVIDER_ID, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import axios from "axios";

// ----- Utils
import { handleProviderAxiosError } from "../../utils/handleProviderAxiosError";

export type GrantsStackProviderOptions = ProviderOptions & {
  type: PROVIDER_ID;
  dataKey: keyof GrantsStackCounts;
  threshold: number;
};

type GrantsStackCounts = {
  projectCount?: number;
  programCount?: number;
};

export type GrantsStackContext = ProviderContext & {
  grantsStack?: GrantsStackCounts;
};

type StatisticResponse = {
  num_grants_contribute_to: number;
  num_rounds_contribute_to: number;
  total_valid_contribution_amount: number;
  num_gr14_contributions: number;
};

export const getGrantsStackData = async (
  payload: RequestPayload,
  context: GrantsStackContext
): Promise<GrantsStackCounts> => {
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
    handleProviderAxiosError(e, "grant stack data", [payload.address]);
  }
};

export class GrantsStackProvider implements Provider {
  type: PROVIDER_ID;
  threshold: number;
  dataKey: keyof GrantsStackCounts;

  constructor(options: GrantsStackProviderOptions) {
    this.type = options.type;
    this.threshold = options.threshold;
    this.dataKey = options.dataKey;
  }

  async verify(payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    try {
      const errors = [];
      let record = undefined;
      const grantsStackData = await getGrantsStackData(payload, context);
      const count = grantsStackData[this.dataKey];
      const valid = count >= this.threshold;
      const contributionStatistic = `${this.type}-${this.threshold}-contribution-statistic`;
      if (valid) {
        record = {
          address: payload.address,
          contributionStatistic,
        };
      } else {
        errors.push(`${this.dataKey}: ${count} is less than ${this.threshold}`);
      }
      return {
        valid,
        record,
        errors,
      };
    } catch (error: unknown) {
      throw new ProviderExternalVerificationError(
        `Grant Stack contribution verification error: ${JSON.stringify(error)}.`
      );
    }
  }
}
