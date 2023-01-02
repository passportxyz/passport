// ----- Types
import type { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import type { Provider, ProviderOptions } from "../../types";
import axios from "axios";

export type MeritProtocolIncomeResponse = {
  id?: string;
  status?: string;
  employment_status?: string;
  employment_updated_at?: string;
  income?: [
    {
      period?: string;
      gross?: {
        total?: string;
        base?: string;
        overtime?: string;
        commission?: string;
        bonus?: string;
      };
    }
  ];
};

export type MeritProtocolIncomeProviderOptions = {
  threshold: number;
  recordAttribute: string;
  error: string;
};

// Export an Eth ERC20 Possessions Provider. This is intended to be a generic implementation that should be extended
export class MeritProtocolIncomeProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "";

  // Options can be set here and/or via the constructor
  _options: MeritProtocolIncomeProviderOptions = {
    threshold: 1,
    recordAttribute: "",
    error: "Income Verification Provider Error",
  };

  // construct the provider instance with supplied options
  constructor(options: ProviderOptions = {}) {
    this._options = { ...this._options, ...options };
    this.type = `${this._options.recordAttribute}#${this._options.threshold}`;
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    let valid = false;
    let amount = 0;
    try {
      if (payload.proofs && payload.proofs.code) {
        let incomeData = await verifyIncome(payload.proofs.code);
        if (incomeData.status == "connected") {
          let attempts = 0;
          while (incomeData.employment_status != "synced") {
            //console.log("Income data is not synced yet - retrying");
            incomeData = await verifyIncome(payload.proofs.code);
            attempts++;
            if (attempts > 10) {
              break;
            }
          }
          if (incomeData.employment_status == "synced") {
            const incomes = incomeData.income;
            const currentYear = new Date().getFullYear();
            const currenYearIncomes = incomes.filter((income) => parseInt(income.period) == currentYear);
            let currentYearAmount = 0;
            if (currenYearIncomes.length > 0) {
              currentYearAmount = parseFloat(currenYearIncomes[0].gross.total);
            }
            const lastYearIncomes = incomes.filter((income) => parseInt(income.period) == currentYear - 1);
            let lastYearAmount = 0;
            if (lastYearIncomes.length > 0) {
              lastYearAmount = parseFloat(lastYearIncomes[0].gross.total);
            }
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            const diff = now.valueOf() - start.valueOf();
            const oneDay = 1000 * 60 * 60 * 24;
            const day = Math.floor(diff / oneDay);
            amount = currentYearAmount + lastYearAmount * ((365 - day) / 365);
          } else {
            return {
              valid: false,
              error: [this._options.error],
            };
          }
        }
      } else {
        // no code, so return an error
        return {
          valid: false,
          error: [this._options.error],
        };
      }
    } catch (e) {
      return {
        valid: false,
        error: [this._options.error],
      };
    } finally {
      valid = amount >= this._options.threshold;
    }
    return {
      valid,
      record: valid
        ? {
            [this._options.recordAttribute]: `${this._options.threshold}`,
          }
        : {},
    };
  }
}

const verifyIncome = async (code: string): Promise<MeritProtocolIncomeResponse> => {
  const incomeRequest = await axios.post(
    process.env.MERIT_HOST_URL + "/api/income",
    { accountId: code },
    { headers: { "x-access-token": process.env.MERIT_TOKEN } }
  );

  if (incomeRequest.status != 200) {
    throw `Get income request returned status code ${incomeRequest.status} instead of the expected 200`;
  }

  return incomeRequest.data as MeritProtocolIncomeResponse;
};
