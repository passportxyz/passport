import type { Provider } from "../../types";
import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { UberUserData, getUberUserData } from "../procedures/reclaim";

async function verifyUberRides(sessionKey: string, context: ProviderContext): Promise<UberUserData> {
  const { id, rides } = await getUberUserData(context, sessionKey);
  return {
    id,
    rides,
  };
}

export type UberRidesOptions = {
  threshold: string;
};

const checkUberRides = (threshold: number, rides: number): { valid: boolean; errors: string[] } => {
  if (rides >= threshold) {
    return {
      valid: true,
      errors: undefined,
    };
  } else {
    return {
      valid: false,
      errors: [`Uber account rides are less than ${threshold}`],
    };
  }
};

export class UberRidesProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "";

  _options = {
    threshold: "1",
  };

  constructor(options: UberRidesOptions) {
    this._options = { ...this._options, ...options };
    this.type = `uberRidesGte#${this._options.threshold}`;
  }

  async verify(payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    const { id, rides } = await verifyUberRides(payload.proofs.sessionKey, context);

    const { valid, errors } = checkUberRides(parseInt(this._options.threshold), rides);

    return {
      valid,
      errors,
      record: { id },
    };
  }
}
